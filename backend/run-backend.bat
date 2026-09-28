@echo off
set "JAVA_HOME=C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.0.1\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ==============================================
echo  Iniciando backend MedFlow (Spring Boot 8085)
echo ==============================================
java -version
call mvnw.cmd spring-boot:run
pause
