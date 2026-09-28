$env:JAVA_HOME = "C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.0.1\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Iniciando backend MedFlow (Spring Boot 8085)" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

java -version
./mvnw spring-boot:run
