import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  template: `
    <div class="status-bar" [class.active]="isActive()">
      <div class="dot-wrap">
        <span class="dot" [class.pulse]="isActive()"></span>
        @if (isActive()) { <span class="ring"></span> }
      </div>
      <span class="status-text">{{ status() }}</span>
      @if (isActive()) {
        <div class="loader">
          <span></span><span></span><span></span>
        </div>
      }
    </div>
  `,
  styles: [`
    .status-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 1.75rem;
      background: rgba(7,7,16,0.7);
      border-bottom: 1px solid var(--border);
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      color: var(--muted);
      min-height: 30px;
      transition: border-color 0.3s;

      &.active {
        border-bottom-color: rgba(124,111,255,0.2);
        background: rgba(124,111,255,0.03);
      }
    }

    .dot-wrap {
      position: relative;
      width: 8px;
      height: 8px;
      flex-shrink: 0;
    }

    .dot {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--muted);
      transition: background 0.3s;

      .active & { background: var(--success); }
      &.pulse { animation: none; }
    }

    .ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid var(--success);
      animation: pulse-ring 1.4s ease-out infinite;
    }

    .status-text {
      color: var(--text2);
      .active & { color: var(--accent); }
    }

    .loader {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-left: 0.25rem;

      span {
        display: block;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--accent);
        animation: dot-bounce 1.2s ease-in-out infinite;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }

    @keyframes dot-bounce {
      0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
      40% { transform: scale(1.5); opacity: 1; }
    }
  `]
})
export class StatusBarComponent {
  status   = input('Pronto');
  isActive = input(false);
}
