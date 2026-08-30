package com.crimelens.chat.controller;

import com.crimelens.intelligence.ml.MlClientInterface;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final MlClientInterface mlClient;

    public ChatController(MlClientInterface mlClient) {
        this.mlClient = mlClient;
    }

    public static class Message {
        private String role;
        private String content;

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public static class ChatRequestPayload {
        private List<Message> messages;
        private String language;

        public List<Message> getMessages() { return messages; }
        public void setMessages(List<Message> messages) { this.messages = messages; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> chat(@RequestBody ChatRequestPayload payload) {
        String lastUserMessage = "";
        if (payload.getMessages() != null && !payload.getMessages().isEmpty()) {
            Message lastMsg = payload.getMessages().get(payload.getMessages().size() - 1);
            if ("user".equalsIgnoreCase(lastMsg.getRole())) {
                lastUserMessage = lastMsg.getContent();
            }
        }

        String responseMessage = mlClient.chatResponse(lastUserMessage, payload.getLanguage());

        Map<String, Object> response = new HashMap<>();
        response.put("message", responseMessage);
        response.put("role", "assistant");
        response.put("is_complete", true);
        response.put("language", payload.getLanguage() != null ? payload.getLanguage() : "en");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate-draft")
    public ResponseEntity<Map<String, Object>> generateDraft(@RequestBody ChatRequestPayload payload) {
        String userContext = "";
        if (payload.getMessages() != null && !payload.getMessages().isEmpty()) {
            userContext = payload.getMessages().stream()
                    .filter(m -> "user".equalsIgnoreCase(m.getRole()))
                    .map(Message::getContent)
                    .collect(Collectors.joining(" "));
        }

        String draftContent = mlClient.generateFirDraft(userContext, payload.getLanguage());

        // Extract or split draft into title/description
        Map<String, Object> draft = new HashMap<>();
        draft.put("title", "Burglary Case FIR Draft");
        draft.put("description", draftContent);
        draft.put("sections", List.of("BNS 303", "BNS 331"));

        Map<String, Object> response = new HashMap<>();
        response.put("draft", draft);

        return ResponseEntity.ok(response);
    }
}
