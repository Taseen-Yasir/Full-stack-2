package com.example.ci_pipeline_lab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBuildRequest(

        @NotBlank(message = "Commit message must not be blank")
        @Size(max = 200, message = "Commit message must not exceed 200 characters")
        String commitMessage

) {
}