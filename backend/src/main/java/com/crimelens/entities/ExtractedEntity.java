package com.crimelens.entities;

import com.crimelens.entities.enums.EntityType;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Embeddable
public class ExtractedEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private EntityType type;

    @Column(name = "entity_value", nullable = false)
    private String value;

    public ExtractedEntity() {
    }

    public ExtractedEntity(EntityType type, String value) {
        this.type = type;
        this.value = value;
    }

    public EntityType getType() {
        return type;
    }

    public void setType(EntityType type) {
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
