package com.example.ci_pipeline_lab.integration;

import com.example.ci_pipeline_lab.entity.BuildRun;
import com.example.ci_pipeline_lab.repository.BuildRunRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
@SpringBootTest
class BuildRunPostgresIntegrationTest {

    @Container
    static final PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("ci_pipeline_test")
                    .withUsername("ci_test_user")
                    .withPassword("ci_test_password");

    @Autowired
    private BuildRunRepository repository;

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {

        registry.add(
                "spring.datasource.url",
                postgres::getJdbcUrl
        );

        registry.add(
                "spring.datasource.username",
                postgres::getUsername
        );

        registry.add(
                "spring.datasource.password",
                postgres::getPassword
        );

        registry.add(
                "spring.datasource.driver-class-name",
                postgres::getDriverClassName
        );

        registry.add(
                "spring.jpa.hibernate.ddl-auto",
                () -> "create-drop"
        );
    }

    @Test
    @Transactional
    void shouldSaveAndRetrieveBuildFromPostgres() {

        BuildRun build = new BuildRun(
                "Verify PostgreSQL with Testcontainers"
        );

        BuildRun saved = repository.saveAndFlush(build);

        assertNotNull(saved.getId());
        assertEquals("QUEUED", saved.getStatus());

        BuildRun retrieved = repository.findById(saved.getId())
                .orElseThrow();

        assertEquals(
                "Verify PostgreSQL with Testcontainers",
                retrieved.getCommitMessage()
        );

        assertEquals("QUEUED", retrieved.getStatus());
        assertNotNull(retrieved.getCreatedAt());
    }

    @Test
    @Transactional
    void shouldPersistMultipleBuildRecords() {

        repository.saveAndFlush(
                new BuildRun("First integration build")
        );

        repository.saveAndFlush(
                new BuildRun("Second integration build")
        );

        assertTrue(repository.count() >= 2);
    }
}