package com.example.ci_pipeline_lab.service;

import com.example.ci_pipeline_lab.entity.BuildRun;
import com.example.ci_pipeline_lab.repository.BuildRunRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BuildRunServiceTest {

    @Mock
    private BuildRunRepository repository;

    @InjectMocks
    private BuildRunService service;

    @Test
    void createBuildShouldTrimMessageAndSave() {
        when(repository.save(any(BuildRun.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BuildRun result = service.createBuild("  Add CI tests  ");

        assertEquals("Add CI tests", result.getCommitMessage());
        assertEquals("QUEUED", result.getStatus());

        verify(repository).save(any(BuildRun.class));
    }

    @Test
    void createBuildShouldRejectBlankMessage() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.createBuild("   ")
        );

        verifyNoInteractions(repository);
    }

    @Test
    void createBuildShouldRejectMessageOver200Characters() {
        String longMessage = "A".repeat(201);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.createBuild(longMessage)
        );

        verifyNoInteractions(repository);
    }

    @Test
    void getAllBuildsShouldReturnRepositoryRecords() {
        List<BuildRun> builds = List.of(
                new BuildRun("Add unit tests"),
                new BuildRun("Fix API validation")
        );

        when(repository.findAll()).thenReturn(builds);

        List<BuildRun> result = service.getAllBuilds();

        assertEquals(2, result.size());
        assertEquals(builds, result);

        verify(repository).findAll();
    }

    @Test
    void getBuildByIdShouldReturnExistingBuild() {
        BuildRun build = new BuildRun("Create CI pipeline");

        when(repository.findById(1L))
                .thenReturn(Optional.of(build));

        BuildRun result = service.getBuildById(1L);

        assertEquals("Create CI pipeline", result.getCommitMessage());
        verify(repository).findById(1L);
    }

    @Test
    void getBuildByIdShouldThrowWhenBuildDoesNotExist() {
        when(repository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                NoSuchElementException.class,
                () -> service.getBuildById(999L)
        );

        verify(repository).findById(999L);
    }
}