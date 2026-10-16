// main.ts — entry fino: importa estilos, instancia o jogo e dá boot.
// Toda a lógica mora em ui/controller.ts; regras em core/; desenho em engine/.

import './styles/base.css';
import './styles/layout.css';
import './styles/componentes.css';
import { GameController } from './ui/controller.js';

const canvas = document.getElementById('cena');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('[main] canvas #cena não encontrado');
}

const game = new GameController(canvas);
game.boot();
