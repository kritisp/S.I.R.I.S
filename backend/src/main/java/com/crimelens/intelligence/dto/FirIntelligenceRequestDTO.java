package com.crimelens.intelligence.dto;

public class FirIntelligenceRequestDTO {

    private String firText;
    private String sourceName;
    private String caseId;
    private byte[] fileBytes;
    private String fileName;
    private String contentType;

    public FirIntelligenceRequestDTO() {
    }

    public FirIntelligenceRequestDTO(String firText, String sourceName, String caseId) {
        this.firText = firText;
        this.sourceName = sourceName;
        this.caseId = caseId;
    }

    public FirIntelligenceRequestDTO(byte[] fileBytes, String fileName, String contentType, String caseId) {
        this.fileBytes = fileBytes;
        this.fileName = fileName;
        this.contentType = contentType;
        this.caseId = caseId;
        this.sourceName = fileName;
    }

    public String getFirText() {
        return firText;
    }

    public void setFirText(String firText) {
        this.firText = firText;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public byte[] getFileBytes() {
        return fileBytes;
    }

    public void setFileBytes(byte[] fileBytes) {
        this.fileBytes = fileBytes;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public boolean hasFile() {
        return fileBytes != null && fileBytes.length > 0;
    }
}
