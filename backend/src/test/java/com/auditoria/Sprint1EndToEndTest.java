package com.auditoria;

import com.auditoria.dto.AnalyzeResponseDTO;
import com.auditoria.dto.FindingDTO;
import com.auditoria.dto.PythonAnalyzeRequestDTO;
import com.auditoria.repository.AuditRepository;
import com.auditoria.repository.FindingRepository;
import com.auditoria.service.PythonClientService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "jwt.secret=auditoria-codigo-secret-key-2026-segura-32chars",
        "python.ai-service.url=http://localhost:8000"
})
@AutoConfigureMockMvc
class Sprint1EndToEndTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuditRepository auditRepository;

    @Autowired
    private FindingRepository findingRepository;

    @MockBean
    private PythonClientService pythonClientService;

    @Test
    void registerLoginAnalyzeAndPersistFindings() throws Exception {
        when(pythonClientService.analyze(ArgumentMatchers.any(PythonAnalyzeRequestDTO.class)))
                .thenAnswer(invocation -> {
                    PythonAnalyzeRequestDTO request = invocation.getArgument(0);
                    return successfulAnalysis(request.getAuditId());
                });

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "sprint1@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("sprint1@example.com"));

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "sprint1@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = loginResponse.split("\"token\":\"")[1].split("\"")[0];

        String auditResponse = mockMvc.perform(post("/api/audits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + token)
                        .content("""
                                {
                                  "language": "java",
                                  "code": "String sql = \\"SELECT * FROM users WHERE id=\\" + userId;"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.riskLevel").value("unknown"))
                .andExpect(jsonPath("$.estimatedTokens").isNumber())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String auditId = auditResponse.split("\"auditId\":\"")[1].split("\"")[0];
        waitForAuditToComplete(token, auditId);

        mockMvc.perform(get("/api/audits")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].auditId").value(auditId))
                .andExpect(jsonPath("$[0].riskLevel").value("critical"))
                .andExpect(jsonPath("$[0].findingsCount").value(1));

        mockMvc.perform(get("/api/audits?language=java&riskLevel=critical")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].auditId").value(auditId));

        mockMvc.perform(get("/api/audits/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAudits").value(1))
                .andExpect(jsonPath("$.totalFindings").value(1))
                .andExpect(jsonPath("$.byRiskLevel.critical").value(1));

        mockMvc.perform(get("/api/audits/" + auditId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.auditId").value(auditId))
                .andExpect(jsonPath("$.code").isNotEmpty())
                .andExpect(jsonPath("$.findings[0].title").value("Possible SQL Injection"));

        assertThat(auditRepository.count()).isEqualTo(1);
        assertThat(findingRepository.count()).isEqualTo(1);
    }

    private void waitForAuditToComplete(String token, String auditId) throws Exception {
        AssertionError lastFailure = null;
        for (int attempt = 0; attempt < 20; attempt++) {
            try {
                mockMvc.perform(get("/api/audits/" + auditId)
                                .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.status").value("success"))
                        .andExpect(jsonPath("$.riskLevel").value("critical"))
                        .andExpect(jsonPath("$.findings[0].severity").value("critical"))
                        .andExpect(jsonPath("$.findings[0].line").value(1));
                return;
            } catch (AssertionError error) {
                lastFailure = error;
                Thread.sleep(100);
            }
        }

        throw lastFailure == null ? new AssertionError("La auditoria no finalizo") : lastFailure;
    }

    @Test
    void auditsEndpointRequiresJwt() throws Exception {
        mockMvc.perform(post("/api/audits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "language": "java",
                                  "code": "class Demo {}"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    private AnalyzeResponseDTO successfulAnalysis(String auditId) {
        FindingDTO finding = new FindingDTO();
        finding.setType("security");
        finding.setSeverity("critical");
        finding.setTitle("Possible SQL Injection");
        finding.setDescription("The code concatenates user input directly into SQL.");
        finding.setLine(1);
        finding.setSuggestion("Use parameterized queries.");

        AnalyzeResponseDTO response = new AnalyzeResponseDTO();
        response.setAuditId(auditId);
        response.setStatus("success");
        response.setFindings(List.of(finding));
        response.setPedagogicalExplanation("SQL Injection permite modificar consultas con datos externos.");
        response.setRefactoredCode("PreparedStatement stmt = connection.prepareStatement(\"SELECT * FROM users WHERE id = ?\");");
        return response;
    }
}