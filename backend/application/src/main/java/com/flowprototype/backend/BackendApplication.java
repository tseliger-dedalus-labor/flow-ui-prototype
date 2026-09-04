package com.flowprototype.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Startpunkt der zusammengesetzten Backend-Anwendung.
 *
 * <p>Die Anwendung bündelt die Produktionsmodule für Flow-Plattform, Editor,
 * Patienten-Workflow und Terminplanung in einem gemeinsamen Spring-Boot-Prozess.</p>
 */
@SpringBootApplication
public class BackendApplication {
    /**
     * Startet den Spring-Kontext und damit alle Backend-Module.
     *
     * @param args Kommandozeilenargumente der JVM.
     */
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
