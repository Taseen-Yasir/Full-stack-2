package com.example.postapi.service;

import com.example.postapi.dto.PostRequest;
import com.example.postapi.entity.Post;
import com.example.postapi.repository.PostRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public Post createPost(PostRequest request) {
        Post post = new Post(
                request.getTitle(),
                request.getContent(),
                request.getPlatform(),
                request.getScheduledAt()
        );

        return postRepository.save(post);
    }

    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    public Post updatePost(Long id, PostRequest request) {
        Post post = getPostById(id);

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setPlatform(request.getPlatform());
        post.setScheduledAt(request.getScheduledAt());

        return postRepository.save(post);
    }

    public void deletePost(Long id) {
        if (!postRepository.existsById(id)) {
            throw new RuntimeException("Post not found");
        }

        postRepository.deleteById(id);
    }
}