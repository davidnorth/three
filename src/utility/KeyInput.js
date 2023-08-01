class KeyInput {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
    };
    window.addEventListener('keydown', (event) => {
      if (event.code === "KeyW") this.keys.w = true;
      if (event.code === "KeyA") this.keys.a = true;
      if (event.code === "KeyS") this.keys.s = true;
      if (event.code === "KeyD") this.keys.d = true;
      if (event.code === "Space") this.keys.space = true;
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === "KeyW") this.keys.w = false;
      if (event.code === "KeyA") this.keys.a = false;
      if (event.code === "KeyS") this.keys.s = false;
      if (event.code === "KeyD") this.keys.d = false;
      if (event.code === "Space") this.keys.space = false;
    });
  }
}

export default KeyInput;