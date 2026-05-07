const TRUST_ITEMS = [
  {
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 12l3 3 5-5" />
      </svg>
    ),
    label: 'Flores frescas',
    detail: 'Preparadas no dia',
  },
  {
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    label: 'Entrega e retirada',
    detail: 'Você escolhe',
  },
  {
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h8" />
        <path d="M16 2v4M8 2v4M4 10h16" />
        <path d="M16 19h6M19 16v6" />
      </svg>
    ),
    label: 'Mensagem no cartão',
    detail: 'Escreva com carinho',
  },
  {
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    label: 'Pague online ou na entrega',
    detail: 'Com segurança',
  },
];

export function HomeTrustBar() {
  return (
    <div className="section-divider border-t border-border/60 bg-accent/30">
      <div className="container px-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-4 sm:gap-x-10 sm:py-5">
          {TRUST_ITEMS.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-accent-foreground">
              {item.icon}
              <div className="leading-none">
                <span className="text-xs font-medium sm:text-sm">{item.label}</span>
                <span className="hidden text-xs text-muted-foreground before:mx-1 before:content-['·'] sm:inline">
                  {item.detail}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
