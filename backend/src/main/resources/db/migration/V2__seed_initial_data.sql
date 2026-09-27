-- ============================================================================
-- MEDFLOW - CARGA DE DADOS INICIAIS (SEED V2)
-- 100% EM PORTUGUÊS COM IDs BIGINT SEQUENCIAIS
-- ============================================================================

-- 1. ESPECIALIDADES MEDICAS
INSERT INTO especialidades (id, nome, descricao, icone, cor) OVERRIDING SYSTEM VALUE VALUES
(1, 'Dermatologia', 'Cuidado e saúde para a sua pele.', 'sparkles', 'rose'),
(2, 'Estética', 'Bem-estar que valoriza você.', 'flower', 'peach'),
(3, 'Nutrição', 'Mais equilíbrio em cada escolha.', 'apple', 'sage'),
(4, 'Fisioterapia', 'Movimento e qualidade de vida.', 'activity', 'blue'),
(5, 'Psicologia', 'Um espaço para se ouvir.', 'brain', 'lavender'),
(6, 'Biomedicina Estética', 'Ciência e cuidado em harmonia.', 'flask', 'rose'),
(7, 'Enfermagem', 'Acolhimento em cada etapa.', 'heart', 'peach'),
(8, 'Clínica Geral', 'Um olhar completo para você.', 'stethoscope', 'sage')
ON CONFLICT (id) DO NOTHING;

-- 2. CLINICA PRINCIPAL
INSERT INTO clinicas (id, nome, razao_social, cnpj, telefone, email, endereco, latitude, longitude) OVERRIDING SYSTEM VALUE VALUES
(1, 'Clínica Saúde & Estética', 'MedFlow Saúde Integrada Ltda', '12.345.678/0001-90', '(31) 3333-0000', 'contato@clinica.example', 'Rua das Flores, 120 · Funcionários, Belo Horizonte - MG', -19.922700, -43.945100)
ON CONFLICT (id) DO NOTHING;

-- 3. USUARIOS (SENHA PADRAO: 'Senha123' em BCrypt hash: '$2a$10$e8O0aK77pXJ9i86kR8rWqOU0zHj2aF75d4M92W2n.v7gD21gR67C2')
INSERT INTO usuarios (id, email, senha_hash, perfil) OVERRIDING SYSTEM VALUE VALUES
(1, 'admin@medflow.example', '$2a$10$e8O0aK77pXJ9i86kR8rWqOU0zHj2aF75d4M92W2n.v7gD21gR67C2', 'clinica'),
(2, 'ana@medflow.example', '$2a$10$e8O0aK77pXJ9i86kR8rWqOU0zHj2aF75d4M92W2n.v7gD21gR67C2', 'medico'),
(3, 'beatriz@medflow.example', '$2a$10$e8O0aK77pXJ9i86kR8rWqOU0zHj2aF75d4M92W2n.v7gD21gR67C2', 'medico'),
(4, 'carlos@medflow.example', '$2a$10$e8O0aK77pXJ9i86kR8rWqOU0zHj2aF75d4M92W2n.v7gD21gR67C2', 'medico'),
(5, 'maria@medflow.example', '$2a$10$e8O0aK77pXJ9i86kR8rWqOU0zHj2aF75d4M92W2n.v7gD21gR67C2', 'paciente'),
(6, 'fernanda@medflow.example', '$2a$10$e8O0aK77pXJ9i86kR8rWqOU0zHj2aF75d4M92W2n.v7gD21gR67C2', 'paciente')
ON CONFLICT (id) DO NOTHING;

-- 4. MEDICOS COM LOCALIZACAO E COORDENADAS OBRIGATORIAS
INSERT INTO medicos (id, usuario_id, clinica_id, especialidade_id, nome, primeiro_nome, crm, email, telefone, biografia, avaliacao, nome_consultorio, endereco, latitude, longitude) OVERRIDING SYSTEM VALUE VALUES
(1, 2, 1, 1, 'Dra. Ana Silva', 'Dra. Ana', 'CRM 123456/MG', 'ana@medflow.example', '(31) 99999-0001', 'Especialista em dermatologia clínica e estética com foco em saúde da pele.', '4,9', 'Consultório Dra. Ana Silva', 'Rua das Flores, 120, Sala 301 - Funcionários, Belo Horizonte - MG', -19.922700, -43.945100),
(2, 3, 1, 2, 'Dra. Beatriz Lima', 'Dra. Beatriz', 'CRM 123457/MG', 'beatriz@medflow.example', '(31) 99999-0002', 'Procedimentos estéticos avançados e rejuvenescimento facial.', '4,8', 'Espaço Beatriz Estética', 'Av. Afonso Pena, 1500, Sala 804 - Centro, Belo Horizonte - MG', -19.928100, -43.937200),
(3, 4, 1, 3, 'Dr. Carlos Souza', 'Dr. Carlos', 'CRN 12345/MG', 'carlos@medflow.example', '(31) 99999-0003', 'Nutrição esportiva e reeducação alimentar personalizada.', '4,9', 'NutriVida Consultório', 'Rua Sergipe, 1000 - Savassi, Belo Horizonte - MG', -19.938200, -43.935500)
ON CONFLICT (id) DO NOTHING;

-- 5. PACIENTES
INSERT INTO pacientes (id, usuario_id, nome, cpf, data_nascimento, telefone, email) OVERRIDING SYSTEM VALUE VALUES
(1, 5, 'Maria Oliveira', '111.222.333-44', '1990-05-12', '(31) 99999-1001', 'maria@medflow.example'),
(2, 6, 'Fernanda Souza', '222.333.444-55', '1988-11-20', '(31) 99999-1002', 'fernanda@medflow.example')
ON CONFLICT (id) DO NOTHING;

-- 6. AGENDAS E HORARIOS DOS MEDICOS
INSERT INTO agendas_medicos (id, medico_id, data_agenda) OVERRIDING SYSTEM VALUE VALUES
(1, 1, CURRENT_DATE),
(2, 1, CURRENT_DATE + INTERVAL '1 day'),
(3, 2, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- Horários liberados para Dra. Ana Silva
INSERT INTO horarios_agenda (id, agenda_id, horario, disponivel) OVERRIDING SYSTEM VALUE VALUES
(1, 1, '08:00', TRUE),
(2, 1, '08:30', TRUE),
(3, 1, '09:00', FALSE), -- Já reservado
(4, 1, '09:30', TRUE),
(5, 1, '10:00', TRUE),
(6, 1, '14:00', TRUE),
(7, 1, '14:30', TRUE),
(8, 1, '15:00', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. CONSULTAS DE TESTE
INSERT INTO consultas (id, paciente_id, medico_id, clinica_id, data_consulta, horario_consulta, status, tipo, motivo) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, CURRENT_DATE, '09:00', 'Confirmado', 'Primeira consulta', 'Gostaria de avaliar manchas no rosto causadas pelo sol.'),
(2, 2, 2, 1, CURRENT_DATE + INTERVAL '1 day', '14:00', 'Pendente', 'Retorno', 'Acompanhamento do protocolo de hidratação e pele.')
ON CONFLICT (id) DO NOTHING;

-- 8. PRONTUARIOS MEDICOS
INSERT INTO prontuarios (id, paciente_id, medico_id, resumo) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'Paciente em acompanhamento dermatológico preventivo.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO anotacoes_prontuario (id, prontuario_id, nome_autor, conteudo) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Dra. Ana Silva', 'Primeira avaliação dermatológica realizada. Solicitado uso diário de protetor solar FPS 50.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO documentos_prontuario (id, prontuario_id, titulo, conteudo_texto) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Receituário Dermatológico Inicial', 'Uso contínuo: Filtro solar FPS 50 a cada 3 horas. Hidratante facial calmante à noite.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ATUALIZA AS SEQUENCIAS DOS IDs BIGINT PARA CONTINUAREM SOMANDO AUTOMATICAMENTE
-- ============================================================================
SELECT setval(pg_get_serial_sequence('especialidades', 'id'), COALESCE(MAX(id), 1)) FROM especialidades;
SELECT setval(pg_get_serial_sequence('clinicas', 'id'), COALESCE(MAX(id), 1)) FROM clinicas;
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), COALESCE(MAX(id), 1)) FROM usuarios;
SELECT setval(pg_get_serial_sequence('medicos', 'id'), COALESCE(MAX(id), 1)) FROM medicos;
SELECT setval(pg_get_serial_sequence('pacientes', 'id'), COALESCE(MAX(id), 1)) FROM pacientes;
SELECT setval(pg_get_serial_sequence('agendas_medicos', 'id'), COALESCE(MAX(id), 1)) FROM agendas_medicos;
SELECT setval(pg_get_serial_sequence('horarios_agenda', 'id'), COALESCE(MAX(id), 1)) FROM horarios_agenda;
SELECT setval(pg_get_serial_sequence('consultas', 'id'), COALESCE(MAX(id), 1)) FROM consultas;
SELECT setval(pg_get_serial_sequence('prontuarios', 'id'), COALESCE(MAX(id), 1)) FROM prontuarios;
SELECT setval(pg_get_serial_sequence('anotacoes_prontuario', 'id'), COALESCE(MAX(id), 1)) FROM anotacoes_prontuario;
SELECT setval(pg_get_serial_sequence('documentos_prontuario', 'id'), COALESCE(MAX(id), 1)) FROM documentos_prontuario;
