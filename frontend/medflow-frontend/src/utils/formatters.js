/**
 * Utilitários de formatação de exibição do MedFlow
 */

/**
 * Formata o nome do médico para exibição na interface, garantindo o prefixo Dr(a).
 * - Se o nome já possuir 'Dr.', 'Dra.' ou 'Dr(a).', preserva sem duplicar.
 * - Caso contrário, adiciona o prefixo 'Dr(a). '.
 * 
 * Exemplo:
 * formatarNomeMedico('Mariana Costa') -> 'Dr(a). Mariana Costa'
 * formatarNomeMedico('Dra. Ana Silva') -> 'Dra. Ana Silva'
 * formatarNomeMedico('Dr. Roberto') -> 'Dr. Roberto'
 */
export function formatarNomeMedico(nome) {
  if (!nome || typeof nome !== 'string') return '';
  const trimmed = nome.trim();
  if (/^(dr\(a\)\.?|dra?\.?)/i.test(trimmed)) {
    return trimmed;
  }
  return `Dr(a). ${trimmed}`;
}

/**
 * Remove qualquer prefixo como 'Dr.', 'Dra.' ou 'Dr(a).' do nome.
 * Usado antes de enviar ao banco de dados para garantir armazenamento limpo.
 */
export function limparNomeMedico(nome) {
  if (!nome || typeof nome !== 'string') return '';
  return nome.trim().replace(/^(dr\(a\)\.?|dra?\.?)\s*/i, '').trim();
}
