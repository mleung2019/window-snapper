const Settings = imports.ui.settings;
const SignalManager = imports.misc.signalManager;
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Panel = imports.ui.panel;

const KEYBINDINGS = [
  { name: "snap-full", topLeft: [0, 0], size: [1, 1] },
  { name: "snap-left", topLeft: [0, 0], size: [0.5, 1] },
  { name: "snap-right", topLeft: [0.5, 0], size: [0.5, 1] },
  { name: "snap-top-left", topLeft: [0, 0], size: [0.5, 0.5] },
  { name: "snap-top-right", topLeft: [0.5, 0], size: [0.5, 0.5] },
  { name: "snap-bottom-left", topLeft: [0, 0.5], size: [0.5, 0.5] },
  { name: "snap-bottom-right", topLeft: [0.5, 0.5], size: [0.5, 0.5] },
  { name: "snap-left-third", topLeft: [0, 0], size: [0.333, 1] },
  { name: "snap-middle-third", topLeft: [0.333, 0], size: [0.333, 1] },
  { name: "snap-right-third", topLeft: [0.666, 0], size: [0.334, 1] },
];

// Panel functions from gTile@shuairan
function getPanelHeight(panel) {
  return panel.height || panel.actor.get_height(); // fallback for old versions of Cinnamon
}

function getUsableScreenArea(monitor) {
  let top = monitor.y;
  let bottom = monitor.y + monitor.height;
  let left = monitor.x;
  let right = monitor.x + monitor.width;

  for (let panel of Main.panelManager.getPanelsInMonitor(monitor.index)) {
    if (!panel.isHideable()) {
      switch (panel.panelPosition) {
        case Panel.PanelLoc.top:
          top += getPanelHeight(panel);
          break;
        case Panel.PanelLoc.bottom:
          bottom -= getPanelHeight(panel);
          break;
        case Panel.PanelLoc.left:
          left += getPanelHeight(panel); // even vertical panels use 'height'
          break;
        case Panel.PanelLoc.right:
          right -= getPanelHeight(panel);
          break;
      }
    }
  }

  let width = right > left ? right - left : 0;
  let height = bottom > top ? bottom - top : 0;
  return [left, top, width, height];
}

function moveWindow([xLeft, yTop], [width, height]) {
  let win = global.display.get_focus_window();
  if (!win) return;

  // Unmaximize window before snapping
  win.unmaximize(Meta.MaximizeFlags.BOTH);

  let monitorIndex = win.get_monitor();
  let monitor = Main.layoutManager.monitors[monitorIndex];
  const [screenLeft, screenTop, screenWidth, screenHeight] =
    getUsableScreenArea(monitor);

  const newX = screenLeft + screenWidth * xLeft;
  const newY = screenTop + screenHeight * yTop;
  const newW = screenWidth * width;
  const newH = screenHeight * height;

  win.move_resize_frame(false, newX, newY, newW, newH);
}

// Adapted from adjacent-windows@klangman
class WindowSnapper {
  constructor(metadata) {
    this.metadata = metadata;
  }

  enable() {
    this.settings = new Settings.ExtensionSettings(this, this.metadata.uuid);
    this.signalManager = new SignalManager.SignalManager(null);

    for (const keybind of KEYBINDINGS) {
      this.signalManager.connect(
        this.settings,
        `changed::${keybind.name}`,
        this.updateHotkeys,
        this
      );
    }

    this.registerHotkeys();
  }

  disable() {
    this.removeHotkeys();
    this.signalManager.disconnectAllSignals();
  }

  updateHotkeys() {
    this.removeHotkeys();
    this.registerHotkeys();
  }

  getHotkeySequence(name) {
    let str = this.settings.getValue(name);
    if (str && str.length > 0 && str != "::") {
      return str;
    }
    return null;
  }

  registerHotkeys() {
    for (const keybind of KEYBINDINGS) {
      const combo = this.getHotkeySequence(keybind.name);
      if (combo) {
        Main.keybindingManager.addHotKey(
          keybind.name,
          combo,
          Lang.bind(this, () => {
            moveWindow(keybind.topLeft, keybind.size);
          })
        );
      }
    }
  }

  removeHotkeys() {
    for (const keybind of KEYBINDINGS) {
      Main.keybindingManager.removeHotKey(keybind.name);
    }
  }
}

let extension = null;
function init(metadata) {
  if (!extension) {
    extension = new WindowSnapper(metadata);
  }
}

function enable() {
  extension.enable();
}

function disable() {
  extension.disable();
  extension = null;
}
