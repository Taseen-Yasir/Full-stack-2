package com.example.ci_pipeline_lab.controller;

import com.example.ci_pipeline_lab.dto.CreateBuildRequest;
import com.example.ci_pipeline_lab.entity.BuildRun;
import com.example.ci_pipeline_lab.service.BuildRunService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/builds")
public class BuildRunController {

    private final BuildRunService service;

    public BuildRunController(BuildRunService service) {
        this.service = service;
    }

    // Create a new build record
    @PostMapping
    public ResponseEntity<BuildRun> createBuild(
            @Valid @RequestBody CreateBuildRequest request) {

        try {
            BuildRun build = service.createBuild(
                    request.commitMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(build);

        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    exception.getMessage()
            );
        }
    }

    // Get all build records
    @GetMapping
    public List<BuildRun> getAllBuilds() {
        return service.getAllBuilds();
    }

    // Get a build record by ID
    @GetMapping("/{id}")
    public BuildRun getBuildById(@PathVariable Long id) {

        try {
            return service.getBuildById(id);

        } catch (NoSuchElementException exception) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    exception.getMessage()
            );
        }
    }
}