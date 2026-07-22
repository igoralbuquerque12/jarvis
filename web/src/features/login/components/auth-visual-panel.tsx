import visualImage from '../../../../../ui ux/left image login.png';

export function AuthVisualPanel() {
  return (
    <aside className="auth-visual-panel" aria-label="Conheça o Jarvis">
      <img className="auth-visual-panel__image" src={visualImage} alt="Jarvis: assistente pessoal no WhatsApp para lembretes, finanças e tarefas." />
      <p className="sr-only">Organize a sua vida do seu jeito com o assistente pessoal Jarvis no WhatsApp.</p>
    </aside>
  );
}
