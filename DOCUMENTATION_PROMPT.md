# Technical Documentation Prompt

Use this prompt to generate high-quality technical documentation similar to this project:

---

**Prompt for High-Quality Technical Documentation:**

```
Create comprehensive technical documentation for [PROJECT_NAME]. Follow these requirements:

**Tone & Style:**
- Use a serious, technical tone focused on documentation, not marketing
- Be direct and factual - no excitement, fluff, or justifications
- Don't present alternatives or highlight strengths unless specifically requested
- Provide appropriate detail level: enough to understand implementation, not overwhelming
- If someone wants more detail, they'll ask for the code

**Documentation Structure:**
1. **Clear project description** - What it does and its purpose
2. **Operations/Features** - Simple bullet points of functionality
3. **API Documentation** - Reference Swagger/OpenAPI as the source of truth
4. **Deployment** - Default to PowerShell, link to alternatives in separate files
5. **Integration instructions** - How to use with target platform
6. **Configuration** - Environment variables and request parameters
7. **Architecture** - Technology stack and key components
8. **Monitoring** - Health checks and common issues
9. **Project structure** - File organization
10. **Related documentation** - Links to other files

**Key Principles:**
- Use Swagger/OpenAPI specifications as the primary API documentation source
- Don't duplicate API details that are better maintained in Swagger
- Focus on practical usage over comprehensive explanations
- Ensure all authentication methods are accurately documented
- Verify implementation details match the actual code
- Remove any language that implies official product status if it's a third-party integration
- Keep deployment instructions concise with PowerShell as default
- Include troubleshooting for common authentication and configuration issues

**Validation:**
- Check that all mentioned headers, environment variables, and endpoints match the actual implementation
- Ensure authentication mechanisms are correctly documented
- Verify all file references and links are accurate
- Remove marketing language and replace with technical descriptions

Please analyze the project structure, code, and existing documentation first, then create documentation that provides technical value without unnecessary elaboration.
```

---

## Usage Examples:

**For Azure Functions project:**
```
Create comprehensive technical documentation for my Azure Functions API. [Include the prompt above]
```

**For integration project:**
```
Create comprehensive technical documentation for my Salesforce integration service. [Include the prompt above]
```

**For library/SDK:**
```
Create comprehensive technical documentation for my TypeScript SDK. [Include the prompt above]
```

## Key Success Factors:

This prompt works well because it:
- ✅ Maintains professional, technical tone
- ✅ Focuses on practical implementation details  
- ✅ Uses accurate, verified information
- ✅ Provides appropriate detail without overwhelming
- ✅ References proper authentication methods
- ✅ Follows logical, consistent structure
- ✅ Avoids marketing fluff and focuses on technical value
