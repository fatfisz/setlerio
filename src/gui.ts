import { GUI } from 'dat.gui';

let gui: GUI | null = null;

export function updateGui(): void {
  useGui((gui) => {
    gui.updateDisplay();
  });
}

export function useGui(callback: (gui: GUI) => void): void {
  if (process.env.NODE_ENV !== 'production') {
    if (gui === null) {
      gui = new (require('dat.gui').GUI)() as GUI;
      gui.close();
    }
    callback(gui);
  }
}
