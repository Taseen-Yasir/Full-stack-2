package com.example.ci_pipeline_lab.service;

import com.example.ci_pipeline_lab.entity.BuildRun;
import com.example.ci_pipeline_lab.repository.BuildRunRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class BuildRunService {

    private final BuildRunRepository repository;

    public BuildRunService(BuildRunRepository repository) {
        this.repository = repository;
    }

    public BuildRun createBuild(String commitMessage) {

        if (commitMessage == null || commitMessage.isBlank()) {
            throw new IllegalArgumentException(
                    "Commit message must not be blank"
            );
        }

        String normalizedMessage = commitMessage.trim();

        if (normalizedMessage.length() > 200) {
            throw new IllegalArgumentException(
                    "Commit message must not exceed 200 characters"
            );
        }

        BuildRun build = new BuildRun(normalizedMessage);

        return repository.save(build);
    }

    public List<BuildRun> getAllBuilds() {
        return repository.findAll();
    }

    public BuildRun getBuildById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "Build not found: " + id
                ));
    }
}