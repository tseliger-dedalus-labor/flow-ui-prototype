package com.flowprototype.backend.flow.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PrtTypeTest {
    @Test
    void exposesIxServCompatiblePrintTypes() {
        assertThat(PrtType.values()).containsExactly(
            PrtType.PRTTYPE_NONE,
            PrtType.PRTTYPE_ORDER,
            PrtType.PRTTYPE_REPORT,
            PrtType.PRTTYPE_DOCUMENT,
            PrtType.PRTTYPE_TRAFU
        );
    }
}
