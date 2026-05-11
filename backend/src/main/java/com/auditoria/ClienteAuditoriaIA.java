package com.auditoria;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class ClienteAuditoriaIA {

    public void solicitarAuditoria() {
        try {
            // 1. PREPARAR LA CONEXIÓN Y EL ENVÍO (Client Rest - POST)
            DefaultHttpClient httpClient = new DefaultHttpClient();
            HttpPost postRequest = new HttpPost("http://localhost:8000/api/auditoria"); 

            // Tomamos el "json in" exactamente como lo definió Julio
            String jsonIn = "{\"auditId\":\"6d6b0a3a-4d7c-4d92-bb8f-3f6d7b91b111\",\"language\":\"java\",\"code\":\"String sql = \\\"SELECT * FROM users WHERE id=\\\" + userId;\"}";
            StringEntity input = new StringEntity(jsonIn);
            input.setContentType("application/json");
            postRequest.setEntity(input);

            // 2. EJECUTAR LA PETICIÓN Y ESPERAR LA RESPUESTA
            HttpResponse response = httpClient.execute(postRequest);

            if (response.getStatusLine().getStatusCode() != 200 && response.getStatusLine().getStatusCode() != 201) {
                throw new RuntimeException("Failed : HTTP error code : " + response.getStatusLine().getStatusCode());
            }

            // 3. LEER EL TEXTO DE LA RESPUESTA
            BufferedReader br = new BufferedReader(new InputStreamReader((response.getEntity().getContent())));
            String output;
            StringBuilder jsonTexto = new StringBuilder();
            while ((output = br.readLine()) != null) {
                jsonTexto.append(output);
            }
            httpClient.getConnectionManager().shutdown();

            // 4. DECODIFICAR EL JSON (Decoding)
            JSONParser parser = new JSONParser();
            JSONObject jsonOut = (JSONObject) parser.parse(jsonTexto.toString());

            // 5. EXTRAER LOS DATOS PARA TUS TAREAS DEL SPRINT 2
            JSONArray findings = (JSONArray) jsonOut.get("findings");
            JSONObject primerHallazgo = (JSONObject) findings.get(0);

            String severidad = (String) primerHallazgo.get("severity");
            String explicacion = (String) jsonOut.get("pedagogicalExplanation");
            String codigoMejorado = (String) jsonOut.get("refactoredCode");

            System.out.println("Nivel de Riesgo para clasificar: " + severidad);
            System.out.println("Explicación a persistir en BD: " + explicacion);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
// Archivo listo para US-13
