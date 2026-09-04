import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

/**
 * Analysiert Flow-Komponenten in allen Frontend-Projekten, validiert deren Metadaten
 * und synchronisiert daraus generierte Komponenten-Manifeste.
 */
const frontendRoot = process.cwd();
const checkOnly = process.argv.includes('--check');
const projectsRoot = path.join(frontendRoot, 'projects');
const semanticTypes = loadSemanticTypes();
const ixtDisplayTypes = loadIxtDisplayTypes();
const presenterBaseClasses = new Set(['AContentPresenter', 'ASidebarPresenter']);
const generatedManifests = [];
const errors = [];

// Jedes Paket wird unabhängig geprüft, damit Fehler präzise dem jeweiligen Feature-Modul zugeordnet bleiben.
for (const entry of fs.readdirSync(projectsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const projectRoot = path.join(projectsRoot, entry.name);
  const packagePath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packagePath)) {
    continue;
  }

  const packageJson = readJson(packagePath);
  if (typeof packageJson.flowComponents !== 'string') {
    if (usesFlowComponentApi(projectRoot)) {
      errors.push(
        `${relativePath(packagePath)}: Das Projekt verwendet die Flow-Widget-API, ` +
        'definiert aber kein flowComponents-Manifest.'
      );
    }
    continue;
  }

  validateProject(projectRoot, packageJson);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

// Im Check-Modus wird nur Drift erkannt; sonst werden die Manifeste auf das validierte Soll geschrieben.
for (const generated of generatedManifests) {
  if (checkOnly) {
    const current = fs.existsSync(generated.path) ? fs.readFileSync(generated.path, 'utf8') : '';
    if (normalizeNewlines(current) !== generated.content) {
      console.error(
        `- ${relativePath(generated.path)} ist nicht aktuell. ` +
        'Bitte "npm run generate:components" ausführen.'
      );
      process.exitCode = 1;
    }
    continue;
  }

  fs.writeFileSync(generated.path, generated.content.replaceAll('\n', os.EOL), 'utf8');
  console.log(`Komponenten-Manifest erzeugt: ${relativePath(generated.path)}`);
}

if (checkOnly && process.exitCode !== 1) {
  console.log('Alle Komponenten-Manifeste sind vollständig und aktuell.');
}

/**
 * Validiert die Paketkonventionen eines Projekts und erzeugt dessen Manifestmodell.
 */
function validateProject(projectRoot, packageJson) {
  if (typeof packageJson.name !== 'string' || packageJson.name.trim() === '') {
    errors.push(`${relativePath(path.join(projectRoot, 'package.json'))}: Paketname fehlt.`);
    return;
  }
  if (typeof packageJson.version !== 'string' || packageJson.version.trim() === '') {
    errors.push(`${relativePath(path.join(projectRoot, 'package.json'))}: Paketversion fehlt.`);
    return;
  }
  if (path.dirname(packageJson.flowComponents.replaceAll('\\', '/')) !== '.') {
    errors.push(
      `${relativePath(path.join(projectRoot, 'package.json'))}: ` +
      'flowComponents muss auf eine Datei im Paketwurzelverzeichnis verweisen.'
    );
    return;
  }

  const roots = packageJson.flowComponentRoots;
  if (!Array.isArray(roots) || roots.length === 0 || roots.some((root) => typeof root !== 'string')) {
    errors.push(
      `${relativePath(path.join(projectRoot, 'package.json'))}: ` +
      '"flowComponentRoots" muss mindestens ein Komponentenverzeichnis enthalten.'
    );
    return;
  }

  const sourceFiles = collectFiles(path.join(projectRoot, 'src'), (file) =>
    file.endsWith('.ts') && !file.endsWith('.spec.ts')
  );
  const compilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    experimentalDecorators: true,
    skipLibCheck: true
  };
  const program = ts.createProgram(sourceFiles, compilerOptions);
  const checker = program.getTypeChecker();
  const projectSourceFiles = program.getSourceFiles()
    .filter((sourceFile) => isPathInside(sourceFile.fileName, path.join(projectRoot, 'src')));
  // Definitionen stammen aus FLOW_COMPONENTS, erwartete Komponenten aus den konfigurierten Root-Verzeichnissen.
  const definitions = findDefinitions(projectSourceFiles, checker, projectRoot);
  const expectedComponents = findExpectedComponents(projectSourceFiles, projectRoot, roots);

  validateDefinitionCoverage(definitions, expectedComponents, projectRoot);
  validateDescriptors(definitions, checker);

  if (definitions.length === 0) {
    errors.push(`${relativePath(projectRoot)}: FLOW_COMPONENTS enthält keine Komponenten.`);
    return;
  }

  const ids = new Set();
  const displayTypes = new Map();
  for (const definition of definitions) {
    if (ids.has(definition.descriptor.id)) {
      errors.push(`${definition.location}: Komponenten-ID '${definition.descriptor.id}' ist mehrfach definiert.`);
    }
    ids.add(definition.descriptor.id);
    const displayType = definition.descriptor.displayType;
    if (displayType !== undefined) {
      const existing = displayTypes.get(displayType);
      if (existing) {
        errors.push(
          `${definition.location}: IxtDisplayType '${displayType}' ist bereits ` +
          `der Komponente '${existing}' zugeordnet.`
        );
      } else {
        displayTypes.set(displayType, definition.descriptor.id);
      }
    }
  }

  const manifestName = path.basename(packageJson.flowComponents);
  const manifestPath = path.join(projectRoot, 'src', manifestName);
  const manifest = {
    schemaVersion: 2,
    module: packageJson.name,
    moduleVersion: packageJson.version,
    components: definitions.map((definition) => definition.descriptor)
  };
  generatedManifests.push({
    path: manifestPath,
    content: `${JSON.stringify(manifest, null, 2)}\n`
  });
}

/**
 * Findet die einzige exportierte FLOW_COMPONENTS-Liste und alle darin enthaltenen defineFlowComponent-Aufrufe.
 */
function findDefinitions(sourceFiles, checker, projectRoot) {
  const collections = [];
  const allDefinitionCalls = [];

  for (const sourceFile of sourceFiles) {
    // Auch außerhalb von FLOW_COMPONENTS platzierte Aufrufe werden gesammelt, um Regelverstöße gezielt zu melden.
    visit(sourceFile, (node) => {
      if (isDefineFlowComponentCall(node)) {
        allDefinitionCalls.push(node);
      }
    });

    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement) || !hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        continue;
      }

      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'FLOW_COMPONENTS') {
          continue;
        }
        const initializer = unwrapExpression(declaration.initializer);
        if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
          errors.push(`${locationOf(declaration, sourceFile)}: FLOW_COMPONENTS muss ein Array-Literal sein.`);
          continue;
        }
        collections.push({ sourceFile, initializer });
      }
    }
  }

  if (collections.length !== 1) {
    errors.push(
      `${relativePath(projectRoot)}: Erwartet wird genau eine exportierte FLOW_COMPONENTS-Liste, ` +
      `gefunden wurden ${collections.length}.`
    );
    return [];
  }

  const collection = collections[0];
  const collectionCalls = new Set();
  const definitions = [];
  for (const element of collection.initializer.elements) {
    const expression = unwrapExpression(element);
    if (!expression || !isDefineFlowComponentCall(expression)) {
      errors.push(
        `${locationOf(element, collection.sourceFile)}: ` +
        'FLOW_COMPONENTS darf nur direkte defineFlowComponent(...)-Aufrufe enthalten.'
      );
      continue;
    }
    collectionCalls.add(expression);
    const definition = parseDefinition(expression, checker);
    if (definition) {
      definitions.push(definition);
    }
  }

  for (const call of allDefinitionCalls) {
    if (!collectionCalls.has(call)) {
      errors.push(
        `${locationOf(call, call.getSourceFile())}: ` +
        'defineFlowComponent(...) muss direkt in der exportierten FLOW_COMPONENTS-Liste stehen.'
      );
    }
  }

  return definitions;
}

/**
 * Löst eine definierte Flow-Komponente auf und wertet ihren Descriptor statisch aus.
 */
function parseDefinition(call, checker) {
  const sourceFile = call.getSourceFile();
  const location = locationOf(call, sourceFile);
  if (call.arguments.length !== 2) {
    errors.push(`${location}: defineFlowComponent erwartet Komponente und Descriptor.`);
    return undefined;
  }

  const componentExpression = unwrapExpression(call.arguments[0]);
  if (!componentExpression || !ts.isIdentifier(componentExpression)) {
    errors.push(`${location}: Die Flow-Komponente muss als Klassenname angegeben werden.`);
    return undefined;
  }

  let symbol = checker.getSymbolAtLocation(componentExpression);
  if (symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  const componentClass = symbol?.declarations?.find(ts.isClassDeclaration);
  if (!componentClass) {
    errors.push(`${location}: Komponentenklasse '${componentExpression.text}' konnte nicht aufgelöst werden.`);
    return undefined;
  }

  let descriptor;
  try {
    descriptor = evaluateLiteral(call.arguments[1], checker);
  } catch (error) {
    errors.push(`${location}: ${error.message}`);
    return undefined;
  }

  return {
    componentClass,
    descriptor,
    location
  };
}

/**
 * Ermittelt alle Angular-Komponenten unterhalb der konfigurierten flowComponentRoots.
 */
function findExpectedComponents(sourceFiles, projectRoot, configuredRoots) {
  const roots = configuredRoots.map((root) => path.resolve(projectRoot, root));
  const expected = [];

  for (const sourceFile of sourceFiles) {
    if (!roots.some((root) => isPathInside(sourceFile.fileName, root))) {
      continue;
    }

    for (const statement of sourceFile.statements) {
      if (ts.isClassDeclaration(statement) && getDecorator(statement, 'Component')) {
        expected.push(statement);
      }
    }
  }

  return expected;
}

/**
 * Prüft, ob deklarierte Komponenten und erwartete Angular-Komponenten deckungsgleich sind.
 */
function validateDefinitionCoverage(definitions, expectedComponents, projectRoot) {
  const definitionsByClass = new Map();
  for (const definition of definitions) {
    const key = classKey(definition.componentClass);
    const existing = definitionsByClass.get(key);
    if (existing) {
      errors.push(
        `${definition.location}: Komponente '${className(definition.componentClass)}' ist mehrfach definiert.`
      );
    }
    definitionsByClass.set(key, definition);
  }

  const expectedKeys = new Set(expectedComponents.map(classKey));
  for (const componentClass of expectedComponents) {
    if (!definitionsByClass.has(classKey(componentClass))) {
      errors.push(
        `${locationOf(componentClass, componentClass.getSourceFile())}: ` +
        `Für Flow-Komponente '${className(componentClass)}' fehlt die Definition in FLOW_COMPONENTS.`
      );
    }
  }

  for (const definition of definitions) {
    // So wird auch erkannt, wenn versehentlich eine Komponente außerhalb der offiziellen Roots registriert wird.
    if (!expectedKeys.has(classKey(definition.componentClass))) {
      errors.push(
        `${definition.location}: '${className(definition.componentClass)}' liegt außerhalb der ` +
        `in ${relativePath(path.join(projectRoot, 'package.json'))} konfigurierten flowComponentRoots.`
      );
    }
  }
}

/**
 * Validiert Descriptor-Schema, semantische Typen und Angular-Bindings jeder Flow-Komponente.
 */
function validateDescriptors(definitions, checker) {
  for (const definition of definitions) {
    const { componentClass, descriptor, location } = definition;
    if (!isPlainObject(descriptor)) {
      errors.push(`${location}: Der ComponentDescriptor muss ein Objekt-Literal sein.`);
      continue;
    }

    const errorCount = errors.length;
    validateExactKeys(
      descriptor,
      ['id', 'title', 'presenter', 'container', 'inputs', 'outputs'],
      ['displayType'],
      location
    );
    validateNonEmptyString(descriptor.id, `${location}: id`);
    validateNonEmptyString(descriptor.title, `${location}: title`);
    if (!['CONTENT', 'SIDEBAR'].includes(descriptor.presenter)) {
      errors.push(`${location}: presenter muss CONTENT oder SIDEBAR sein.`);
    }
    if (descriptor.displayType !== undefined) {
      validateNonEmptyString(descriptor.displayType, `${location}: displayType`);
    }
    if (typeof descriptor.container !== 'boolean') {
      errors.push(`${location}: container muss boolean sein.`);
    }
    if (!Array.isArray(descriptor.inputs)) {
      errors.push(`${location}: inputs muss ein Array sein.`);
    }
    if (!Array.isArray(descriptor.outputs)) {
      errors.push(`${location}: outputs muss ein Array sein.`);
    }
    if (!Array.isArray(descriptor.inputs) || !Array.isArray(descriptor.outputs)) {
      continue;
    }

    validateInputDescriptors(descriptor.inputs, location);
    validateOutputDescriptors(descriptor.outputs, location);
    if (errors.length === errorCount) {
      validateAngularBindings(componentClass, descriptor, location, checker);
    }
  }
}

/**
 * Prüft Form und fachliche Typisierung aller Input-Descriptoren.
 */
function validateInputDescriptors(inputs, location) {
  const names = new Set();
  for (const input of inputs) {
    if (!isPlainObject(input)) {
      errors.push(`${location}: Jeder Input muss ein Objekt sein.`);
      continue;
    }
    validateExactKeys(input, ['name', 'semanticType', 'required', 'allowedValues'], location);
    validateNonEmptyString(input.name, `${location}: Input.name`);
    if (names.has(input.name)) {
      errors.push(`${location}: Input '${input.name}' ist mehrfach definiert.`);
    }
    names.add(input.name);
    if (!semanticTypes.has(input.semanticType)) {
      errors.push(`${location}: Input '${input.name}' verwendet unbekannten semanticType '${input.semanticType}'.`);
    }
    if (typeof input.required !== 'boolean') {
      errors.push(`${location}: required für Input '${input.name}' muss boolean sein.`);
    }
    if (!Array.isArray(input.allowedValues) || input.allowedValues.some((value) => typeof value !== 'string')) {
      errors.push(`${location}: allowedValues für Input '${input.name}' muss ein String-Array sein.`);
    }
  }
}

/**
 * Prüft Form und Payload-Typisierung aller Output-Descriptoren.
 */
function validateOutputDescriptors(outputs, location) {
  const names = new Set();
  for (const output of outputs) {
    if (!isPlainObject(output)) {
      errors.push(`${location}: Jeder Output muss ein Objekt sein.`);
      continue;
    }
    validateExactKeys(output, ['name', 'payload'], location);
    validateNonEmptyString(output.name, `${location}: Output.name`);
    if (names.has(output.name)) {
      errors.push(`${location}: Output '${output.name}' ist mehrfach definiert.`);
    }
    names.add(output.name);
    if (!isPlainObject(output.payload)) {
      errors.push(`${location}: payload für Output '${output.name}' muss ein Objekt sein.`);
      continue;
    }
    for (const [payloadName, semanticType] of Object.entries(output.payload)) {
      validateNonEmptyString(payloadName, `${location}: Payload-Name`);
      if (!semanticTypes.has(semanticType)) {
        errors.push(
          `${location}: Output '${output.name}' verwendet für '${payloadName}' ` +
          `unbekannten semanticType '${semanticType}'.`
        );
      }
    }
  }
}

/**
 * Spiegelt Angular-Inputs und -Outputs aus Klassenmitgliedern und Komponentenmetadaten in validierbare Maps.
 */
function validateAngularBindings(componentClass, descriptor, location, checker) {
  const angularInputs = new Map();
  const angularOutputs = new Map();

  const unsupportedBaseClass = componentClass.heritageClauses
    ?.filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
    .flatMap((clause) => clause.types)
    .some((type) => !presenterBaseClasses.has(type.expression.getText()));
  if (unsupportedBaseClass) {
    errors.push(
      `${location}: Flow-Komponenten unterstützen ausschließlich Presenter-Basisklassen, ` +
      'da andere geerbte Angular-Inputs und -Outputs nicht eindeutig validiert werden können.'
    );
    return;
  }
  const presenterBaseClass = componentClass.heritageClauses
    ?.filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
    .flatMap((clause) => clause.types)
    .map((type) => type.expression.getText())
    .find((name) => presenterBaseClasses.has(name));
  const expectedPresenter = presenterBaseClass === 'ASidebarPresenter' ? 'SIDEBAR' : 'CONTENT';
  if (descriptor.presenter !== expectedPresenter) {
    errors.push(
      `${location}: Presenter-Typ '${descriptor.presenter}' passt nicht zur Basisklasse '${presenterBaseClass}'.`
    );
    return;
  }

  for (const member of componentClass.members) {
    if (
      !ts.isPropertyDeclaration(member)
      && !ts.isGetAccessorDeclaration(member)
      && !ts.isSetAccessorDeclaration(member)
    ) {
      continue;
    }
    if (!member.name) {
      continue;
    }
    const propertyName = propertyNameOf(member.name);
    if (!propertyName) {
      continue;
    }

    const inputDecorator = getDecorator(member, 'Input');
    if (inputDecorator) {
      const metadata = inputDecoratorMetadata(inputDecorator, propertyName);
      angularInputs.set(metadata.name, {
        member,
        required: metadata.required,
        allowedValues: stringUnionValues(bindingTypeNode(member), checker)
      });
    } else if (ts.isPropertyDeclaration(member)) {
      const signalInput = signalBindingMetadata(member.initializer, 'input', propertyName);
      if (signalInput) {
        angularInputs.set(signalInput.name, {
          member,
          required: signalInput.required,
          allowedValues: stringUnionValues(signalInput.typeNode ?? member.type, checker)
        });
      }
    }

    const outputDecorator = getDecorator(member, 'Output');
    if (outputDecorator) {
      angularOutputs.set(outputBindingName(outputDecorator, propertyName), {
        member,
        payloadKeys: eventEmitterPayloadKeys(member, checker)
      });
    } else if (ts.isPropertyDeclaration(member)) {
      const signalOutput = signalBindingMetadata(member.initializer, 'output', propertyName);
      if (signalOutput) {
        angularOutputs.set(signalOutput.name, {
          member,
          payloadKeys: payloadKeysFromTypeNode(signalOutput.typeNode, checker)
        });
      }
    }
  }

  // Zusätzlich unterstützt der Generator statische inputs/outputs-Arrays in @Component-Metadaten.
  addComponentMetadataBindings(componentClass, 'inputs', angularInputs, location, checker);
  addComponentMetadataBindings(componentClass, 'outputs', angularOutputs, location, checker);

  const descriptorInputs = new Map(descriptor.inputs.map((input) => [input.name, input]));
  const descriptorOutputs = new Map(descriptor.outputs.map((output) => [output.name, output]));

  compareBindingNames('Input', angularInputs, descriptorInputs, location);
  compareBindingNames('Output', angularOutputs, descriptorOutputs, location);

  for (const [name, angularInput] of angularInputs) {
    const descriptorInput = descriptorInputs.get(name);
    if (!descriptorInput) {
      continue;
    }
    if (angularInput.required !== descriptorInput.required) {
      errors.push(
        `${location}: required für Input '${name}' stimmt nicht überein ` +
        `(Angular: ${angularInput.required}, Flow: ${descriptorInput.required}).`
      );
    }
    if (angularInput.allowedValues) {
      compareStringSets(
        angularInput.allowedValues,
        descriptorInput.allowedValues,
        `${location}: allowedValues für Input '${name}' entsprechen nicht dem TypeScript-Union-Typ.`
      );
    } else if (descriptorInput.allowedValues.length > 0) {
      errors.push(
        `${location}: Input '${name}' definiert allowedValues, ` +
        'sein TypeScript-Typ ist aber keine auflösbare String-Union.'
      );
    }
  }

  for (const [name, angularOutput] of angularOutputs) {
    const descriptorOutput = descriptorOutputs.get(name);
    if (!descriptorOutput) {
      continue;
    }
    if (!angularOutput.payloadKeys) {
      errors.push(
        `${location}: Payload-Typ für Output '${name}' konnte nicht statisch aufgelöst werden.`
      );
      continue;
    }
    compareStringSets(
      angularOutput.payloadKeys,
      Object.keys(descriptorOutput.payload),
      `${location}: Payload-Felder für Output '${name}' entsprechen nicht dem EventEmitter-Typ.`
    );
  }
}

/**
 * Meldet Unterschiede zwischen Angular-Binding-Namen und Flow-Descriptor-Namen.
 */
function compareBindingNames(kind, angularBindings, descriptorBindings, location) {
  for (const name of angularBindings.keys()) {
    if (!descriptorBindings.has(name)) {
      errors.push(`${location}: Angular-${kind} '${name}' fehlt in der Flow-Definition.`);
    }
  }
  for (const name of descriptorBindings.keys()) {
    if (!angularBindings.has(name)) {
      errors.push(`${location}: Flow-${kind} '${name}' existiert nicht an der Angular-Komponente.`);
    }
  }
}

/**
 * Wertet ein AST-Fragment auf einen rein statischen JavaScript-Wert aus.
 */
function evaluateLiteral(node, checker) {
  const expression = unwrapExpression(node);
  if (!expression) {
    throw new Error('Metadaten-Ausdruck fehlt.');
  }
  if (ts.isStringLiteralLike(expression)) {
    return expression.text;
  }
  if (ts.isNumericLiteral(expression)) {
    return Number(expression.text);
  }
  if (ts.isPropertyAccessExpression(expression)) {
    if (ts.isIdentifier(expression.expression) && expression.expression.text === 'IxtDisplayType') {
      const value = ixtDisplayTypes.get(expression.name.text);
      if (value === undefined) {
        throw new Error(`Unbekannter IxtDisplayType '${expression.name.text}'.`);
      }
      return value;
    }
    const value = checker.getConstantValue(expression);
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
  }
  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.map((element) => evaluateLiteral(element, checker));
  }
  if (ts.isObjectLiteralExpression(expression)) {
    const result = {};
    for (const property of expression.properties) {
      if (!ts.isPropertyAssignment(property)) {
        throw new Error('Metadaten dürfen nur explizite Property-Zuweisungen enthalten.');
      }
      const name = propertyNameOf(property.name);
      if (!name) {
        throw new Error('Metadaten dürfen keine berechneten Property-Namen enthalten.');
      }
      // Die statische Auswertung bleibt rekursiv, damit auch verschachtelte Payload-Definitionen validierbar sind.
      result[name] = evaluateLiteral(property.initializer, checker);
    }
    return result;
  }
  throw new Error(
    'Metadaten müssen aus statischen String-, Number-, Boolean-, Enum-, Array- und Objekt-Literalen bestehen.'
  );
}

/**
 * Liest Alias und required-Status aus einem @Input-Decorator.
 */
function inputDecoratorMetadata(decorator, fallbackName) {
  const call = unwrapExpression(decorator.expression);
  const argument = ts.isCallExpression(call) ? call.arguments[0] : undefined;
  if (argument && ts.isStringLiteralLike(unwrapExpression(argument))) {
    return { name: unwrapExpression(argument).text, required: false };
  }
  if (argument && ts.isObjectLiteralExpression(unwrapExpression(argument))) {
    const options = unwrapExpression(argument);
    return {
      name: stringProperty(options, 'alias') ?? fallbackName,
      required: booleanProperty(options, 'required') ?? false
    };
  }
  return { name: fallbackName, required: false };
}

/**
 * Ermittelt den öffentlichen Namen eines @Output-Bindings.
 */
function outputBindingName(decorator, fallbackName) {
  const call = unwrapExpression(decorator.expression);
  const argument = ts.isCallExpression(call) ? unwrapExpression(call.arguments[0]) : undefined;
  return argument && ts.isStringLiteralLike(argument) ? argument.text : fallbackName;
}

/**
 * Liest Angular-Signal-Inputs und -Outputs aus einer Property-Initialisierung.
 */
function signalBindingMetadata(initializer, bindingName, fallbackName) {
  const expression = unwrapExpression(initializer);
  if (!expression || !ts.isCallExpression(expression)) {
    return undefined;
  }

  const callee = unwrapExpression(expression.expression);
  let required = false;
  if (ts.isIdentifier(callee) && callee.text === bindingName) {
    required = false;
  } else if (
    bindingName === 'input'
    && ts.isPropertyAccessExpression(callee)
    && ts.isIdentifier(callee.expression)
    && callee.expression.text === 'input'
    && callee.name.text === 'required'
  ) {
    required = true;
  } else {
    return undefined;
  }

  const optionsIndex = bindingName === 'input' && !required ? 1 : 0;
  const options = unwrapExpression(expression.arguments[optionsIndex]);
  return {
    name: options && ts.isObjectLiteralExpression(options)
      ? stringProperty(options, 'alias') ?? fallbackName
      : fallbackName,
    required,
    typeNode: expression.typeArguments?.[0]
  };
}

/**
 * Ermittelt die Payload-Felder eines EventEmitters aus Initializer oder Property-Typ.
 */
function eventEmitterPayloadKeys(member, checker) {
  let typeNode;
  const initializer = ts.isPropertyDeclaration(member) ? unwrapExpression(member.initializer) : undefined;
  if (initializer && ts.isNewExpression(initializer)) {
    typeNode = initializer.typeArguments?.[0];
  }
  const memberType = bindingTypeNode(member);
  if (!typeNode && memberType && ts.isTypeReferenceNode(memberType)) {
    typeNode = memberType.typeArguments?.[0];
  }
  return payloadKeysFromTypeNode(typeNode, checker);
}

/**
 * Liest die Property-Namen eines Objekt-Typs für Output-Payload-Vergleiche aus.
 */
function payloadKeysFromTypeNode(typeNode, checker) {
  if (!typeNode) {
    return undefined;
  }
  const type = checker.getTypeFromTypeNode(typeNode);
  if ((type.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never)) !== 0) {
    return [];
  }
  if ((type.flags & ts.TypeFlags.Object) === 0) {
    return undefined;
  }
  return checker.getPropertiesOfType(type).map((property) => property.getName());
}

/**
 * Extrahiert Literalwerte aus einem String-Union-Typ.
 */
function stringUnionValues(typeNode, checker) {
  if (!typeNode) {
    return undefined;
  }
  const type = checker.getTypeFromTypeNode(typeNode);
  if (!type.isUnion()) {
    return undefined;
  }
  const values = [];
  for (const unionType of type.types) {
    if ((unionType.flags & ts.TypeFlags.StringLiteral) === 0) {
      return undefined;
    }
    values.push(unionType.value);
  }
  return values;
}

/**
 * Liefert den Typknoten eines Inputs oder Setters für weitere Typauswertung.
 */
function bindingTypeNode(member) {
  if (ts.isSetAccessorDeclaration(member)) {
    return member.parameters[0]?.type;
  }
  return member.type;
}

/**
 * Ergänzt Inputs oder Outputs, die direkt in der @Component-Metadatenstruktur deklariert wurden.
 */
function addComponentMetadataBindings(componentClass, propertyName, bindings, location, checker) {
  const componentDecorator = getDecorator(componentClass, 'Component');
  const componentCall = componentDecorator && unwrapExpression(componentDecorator.expression);
  const metadata = componentCall && ts.isCallExpression(componentCall)
    ? unwrapExpression(componentCall.arguments[0])
    : undefined;
  if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
    return;
  }

  const property = metadata.properties.find((candidate) =>
    ts.isPropertyAssignment(candidate) && propertyNameOf(candidate.name) === propertyName
  );
  if (!property || !ts.isPropertyAssignment(property)) {
    return;
  }

  const value = unwrapExpression(property.initializer);
  if (!value || !ts.isArrayLiteralExpression(value)) {
    errors.push(`${location}: @Component.${propertyName} muss ein statisches Array-Literal sein.`);
    return;
  }

  for (const element of value.elements) {
    const parsed = parseComponentMetadataBinding(element, propertyName === 'inputs');
    if (!parsed) {
      errors.push(
        `${location}: @Component.${propertyName} enthält eine nicht unterstützte Binding-Definition.`
      );
      continue;
    }
    if (bindings.has(parsed.publicName)) {
      errors.push(`${location}: Angular-Binding '${parsed.publicName}' ist mehrfach deklariert.`);
      continue;
    }
    const member = componentClass.members.find((candidate) =>
      (
        ts.isPropertyDeclaration(candidate)
        || ts.isGetAccessorDeclaration(candidate)
        || ts.isSetAccessorDeclaration(candidate)
      )
      && candidate.name
      && propertyNameOf(candidate.name) === parsed.memberName
    );
    // Selbst wenn das Klassenmitglied fehlt, wird der Binding-Name gespeichert, damit der Validator den Konflikt erklären kann.
    bindings.set(parsed.publicName, propertyName === 'inputs'
      ? {
          member,
          required: parsed.required,
          allowedValues: member ? stringUnionValues(bindingTypeNode(member), checker) : undefined
        }
      : {
          member,
          payloadKeys: member ? eventEmitterPayloadKeys(member, checker) : undefined
        });
  }
}

/**
 * Parst einen einzelnen Eintrag aus @Component.inputs oder @Component.outputs.
 */
function parseComponentMetadataBinding(node, input) {
  const expression = unwrapExpression(node);
  if (expression && ts.isStringLiteralLike(expression)) {
    const [memberName, alias] = expression.text.split(':').map((part) => part.trim());
    return {
      memberName,
      publicName: alias || memberName,
      required: false
    };
  }
  if (!expression || !ts.isObjectLiteralExpression(expression)) {
    return undefined;
  }
  const memberName = stringProperty(expression, 'name');
  if (!memberName) {
    return undefined;
  }
  return {
    memberName,
    publicName: stringProperty(expression, 'alias') ?? memberName,
    required: input ? booleanProperty(expression, 'required') ?? false : false
  };
}

/**
 * Findet einen Decorator mit dem angegebenen Namen an einem AST-Knoten.
 */
function getDecorator(node, name) {
  const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];
  return decorators.find((decorator) => {
    const expression = unwrapExpression(decorator.expression);
    if (ts.isIdentifier(expression)) {
      return expression.text === name;
    }
    return ts.isCallExpression(expression)
      && ts.isIdentifier(unwrapExpression(expression.expression))
      && unwrapExpression(expression.expression).text === name;
  });
}

/**
 * Liest eine String-Property aus einem Objektliteral.
 */
function stringProperty(objectLiteral, name) {
  const property = objectLiteral.properties.find((candidate) =>
    ts.isPropertyAssignment(candidate) && propertyNameOf(candidate.name) === name
  );
  const value = property && ts.isPropertyAssignment(property)
    ? unwrapExpression(property.initializer)
    : undefined;
  return value && ts.isStringLiteralLike(value) ? value.text : undefined;
}

/**
 * Liest eine Boolean-Property aus einem Objektliteral.
 */
function booleanProperty(objectLiteral, name) {
  const property = objectLiteral.properties.find((candidate) =>
    ts.isPropertyAssignment(candidate) && propertyNameOf(candidate.name) === name
  );
  const value = property && ts.isPropertyAssignment(property)
    ? unwrapExpression(property.initializer)
    : undefined;
  if (value?.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (value?.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  return undefined;
}

/**
 * Prüft Pflicht- und optionale Felder eines einfachen Objektmodells auf exakte Schlüsselmenge.
 */
function validateExactKeys(value, requiredKeys, optionalKeysOrLocation, location) {
  const optionalKeys = Array.isArray(optionalKeysOrLocation) ? optionalKeysOrLocation : [];
  const resolvedLocation = Array.isArray(optionalKeysOrLocation) ? location : optionalKeysOrLocation;
  const expected = new Set([...requiredKeys, ...optionalKeys]);
  for (const key of requiredKeys) {
    if (!Object.hasOwn(value, key)) {
      errors.push(`${resolvedLocation}: Pflichtfeld '${key}' fehlt.`);
    }
  }
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) {
      errors.push(`${resolvedLocation}: Unbekanntes Feld '${key}'.`);
    }
  }
}

/**
 * Stellt sicher, dass ein Wert als nicht-leerer String vorliegt.
 */
function validateNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${label} muss ein nicht-leerer String sein.`);
  }
}

/**
 * Vergleicht zwei Stringmengen deterministisch und erzeugt bei Abweichungen eine verständliche Fehlermeldung.
 */
function compareStringSets(actual, expected, message) {
  if (!Array.isArray(expected)) {
    return;
  }
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (left.length !== right.length || left.some((value, index) => value !== right[index])) {
    errors.push(`${message} Erwartet: [${left.join(', ')}], definiert: [${right.join(', ')}].`);
  }
}

/**
 * Lädt die erlaubten semantischen Typen direkt aus dem Flow-Plattform-Modell.
 */
function loadSemanticTypes() {
  const modelsPath = path.join(frontendRoot, 'projects', 'flow-platform', 'src', 'lib', 'models.ts');
  const sourceFile = ts.createSourceFile(
    modelsPath,
    fs.readFileSync(modelsPath, 'utf8'),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS
  );
  for (const statement of sourceFile.statements) {
    if (
      ts.isTypeAliasDeclaration(statement)
      && statement.name.text === 'SemanticType'
      && ts.isUnionTypeNode(statement.type)
    ) {
      const values = statement.type.types
        .filter(ts.isLiteralTypeNode)
        .map((type) => type.literal)
        .filter(ts.isStringLiteralLike)
        .map((literal) => literal.text);
      if (values.length === statement.type.types.length) {
        return new Set(values);
      }
    }
  }
  throw new Error(`SemanticType konnte nicht aus ${relativePath(modelsPath)} gelesen werden.`);
}

/**
 * Lädt alle gültigen IxtDisplayType-Werte direkt aus dem Enum der Flow-Plattform.
 */
function loadIxtDisplayTypes() {
  const enumPath = path.join(
    frontendRoot,
    'projects',
    'flow-platform',
    'src',
    'lib',
    'ixt-display-type.ts'
  );
  const sourceFile = ts.createSourceFile(
    enumPath,
    fs.readFileSync(enumPath, 'utf8'),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS
  );
  for (const statement of sourceFile.statements) {
    if (!ts.isEnumDeclaration(statement) || statement.name.text !== 'IxtDisplayType') {
      continue;
    }
    const values = new Map();
    for (const member of statement.members) {
      const name = propertyNameOf(member.name);
      const initializer = unwrapExpression(member.initializer);
      if (!name || !initializer || !ts.isStringLiteralLike(initializer)) {
        throw new Error(`IxtDisplayType muss String-Literale in ${relativePath(enumPath)} verwenden.`);
      }
      values.set(name, initializer.text);
    }
    return values;
  }
  throw new Error(`IxtDisplayType konnte nicht aus ${relativePath(enumPath)} gelesen werden.`);
}

/**
 * Sammelt Dateien rekursiv unterhalb eines Verzeichnisses anhand eines Prädikats.
 */
function collectFiles(directory, predicate) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath, predicate));
    } else if (predicate(entryPath)) {
      files.push(entryPath);
    }
  }
  return files;
}

/**
 * Erkennt Projekte, die Flow-Widget-APIs nutzen und daher ein Manifest deklarieren müssen.
 */
function usesFlowComponentApi(projectRoot) {
  const sourceRoot = path.join(projectRoot, 'src');
  if (!fs.existsSync(sourceRoot)) {
    return false;
  }
  const sourceFiles = collectFiles(sourceRoot, (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'));
  return sourceFiles.some((file) => {
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TS
    );
    return sourceFile.statements.some((statement) => {
      if (
        !ts.isImportDeclaration(statement)
        || !ts.isStringLiteralLike(statement.moduleSpecifier)
        || statement.moduleSpecifier.text !== 'flow-platform'
      ) {
        return false;
      }
      const bindings = statement.importClause?.namedBindings;
      return ts.isNamedImports(bindings)
        && bindings.elements.some((element) =>
          element.name.text === 'defineFlowComponent' || element.name.text === 'provideFlowWidget'
        );
    });
  });
}

/**
 * Durchläuft einen AST rekursiv in Tiefensuche.
 */
function visit(node, callback) {
  callback(node);
  node.forEachChild((child) => visit(child, callback));
}

/**
 * Prüft, ob ein AST-Knoten ein defineFlowComponent-Aufruf ist.
 */
function isDefineFlowComponentCall(node) {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const expression = unwrapExpression(node.expression);
  return ts.isIdentifier(expression) && expression.text === 'defineFlowComponent';
}

/**
 * Entfernt reine Hüllen wie Klammern, Type Assertions oder Non-Null-Ausdrücke.
 */
function unwrapExpression(node) {
  let current = node;
  while (
    current
    && (
      ts.isParenthesizedExpression(current)
      || ts.isAsExpression(current)
      || ts.isSatisfiesExpression(current)
      || ts.isNonNullExpression(current)
    )
  ) {
    current = current.expression;
  }
  return current;
}

/**
 * Extrahiert einen Property-Namen aus Identifiern und Literalnamen.
 */
function propertyNameOf(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

/**
 * Prüft, ob ein Knoten den angegebenen Modifier trägt.
 */
function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

/**
 * Liefert den lesbaren Namen einer Komponentenklasse.
 */
function className(componentClass) {
  return componentClass.name?.text ?? '<anonym>';
}

/**
 * Erzeugt einen stabilen Schlüssel aus Dateipfad und Klassenname.
 */
function classKey(componentClass) {
  return `${path.resolve(componentClass.getSourceFile().fileName)}#${className(componentClass)}`;
}

/**
 * Formatiert die Quellposition eines AST-Knotens für Fehlermeldungen.
 */
function locationOf(node, sourceFile) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${relativePath(sourceFile.fileName)}:${position.line + 1}`;
}

/**
 * Liest und parst eine JSON-Datei synchron.
 */
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Prüft, ob ein Wert ein schlichtes Objektliteral repräsentiert.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Prüft, ob eine Datei innerhalb eines Verzeichnisses liegt.
 */
function isPathInside(file, directory) {
  const relative = path.relative(path.resolve(directory), path.resolve(file));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Wandelt absolute Pfade in frontend-relative Diagnostikpfade um.
 */
function relativePath(file) {
  return path.relative(frontendRoot, file).replaceAll('\\', '/');
}

/**
 * Vereinheitlicht Zeilenenden für inhaltsbasierte Manifest-Vergleiche.
 */
function normalizeNewlines(value) {
  return value.replaceAll('\r\n', '\n');
}
