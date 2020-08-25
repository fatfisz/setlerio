import { GUI } from 'dat.gui';

let gui: GUI | undefined = undefined;

export function updateGui(): void {
  useGui((gui) => {
    gui.updateDisplay();
  });
}

export function useGui(callback: (gui: GUI) => void): void {
  if (process.env.NODE_ENV !== 'production') {
    if (!gui) {
      gui = new (require('dat.gui').GUI)() as GUI;
      gui.close();
    }
    callback(gui);
  }
}
