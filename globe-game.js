(() => {
  const globe = document.getElementById('globe-spin-button');
  const dialog = document.getElementById('game-dialog');
  const boardElement = document.getElementById('game-board');
  const scoreElement = document.getElementById('game-score');
  const statusElement = document.getElementById('game-status');
  const winElement = document.getElementById('game-win');
  const newButton = document.getElementById('game-new');
  const playAgainButton = document.getElementById('game-play-again');
  const closeButton = document.getElementById('game-close');
  if (!globe || !dialog || !boardElement) return;

  let board;
  let score = 0;
  let won = false;
  let nextTileId = 0;
  let touchStart = null;
  let drag = null;
  let manualRotation = 0;

  const openGame = () => {
    if (!dialog.open) dialog.showModal();
    boardElement.focus();
  };

  globe.addEventListener('click', (event) => {
    // Enter/Space activate the globe for keyboard and assistive-technology users.
    if (event.detail === 0) openGame();
  });

  globe.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = globe.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      lastAngle: Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI,
      turned: 0
    };
    globe.setPointerCapture(event.pointerId);
  });

  globe.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180 / Math.PI;
    const delta = ((angle - drag.lastAngle + 540) % 360) - 180;
    drag.lastAngle = angle;
    drag.turned += Math.abs(delta);
    manualRotation += delta;
    globe.style.setProperty('--globe-manual-rotation', `${manualRotation}deg`);
    if (drag.turned >= 320) {
      drag = null;
      openGame();
    }
  });

  const endDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = null;
  };
  globe.addEventListener('pointerup', endDrag);
  globe.addEventListener('pointercancel', endDrag);
  globe.addEventListener('lostpointercapture', () => { drag = null; });

  const randomEmptyCell = () => {
    const empty = [];
    board.forEach((row, y) => row.forEach((value, x) => { if (!value) empty.push([y, x]); }));
    if (!empty.length) return false;
    const [y, x] = empty[Math.floor(Math.random() * empty.length)];
    board[y][x] = { id: nextTileId++, value: Math.random() < 0.9 ? 2 : 4 };
    return true;
  };

  const render = (previousPositions = new Map(), mergedIds = new Set()) => {
    boardElement.replaceChildren();
    board.forEach((row, y) => row.forEach((tile, x) => {
      const cell = document.createElement('div');
      cell.className = 'game-cell';
      cell.setAttribute('role', 'gridcell');
      const value = tile?.value || 0;
      cell.dataset.value = String(value);
      cell.textContent = value ? String(value) : '';
      cell.setAttribute('aria-label', value ? String(value) : 'Empty');
      if (tile) cell.dataset.tileId = String(tile.id);
      boardElement.append(cell);
      if (!tile || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const origin = previousPositions.get(tile.id);
      if (!origin) {
        cell.animate([
          { transform: 'scale(.78)', opacity: .5 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 150, easing: 'cubic-bezier(.2,.7,.25,1)' });
        return;
      }

      const gap = parseFloat(getComputedStyle(boardElement).gap) || 0;
      const distance = cell.getBoundingClientRect().width + gap;
      const xOffset = (origin.x - x) * distance;
      const yOffset = (origin.y - y) * distance;
      const start = `translate(${xOffset}px, ${yOffset}px)`;
      if (xOffset || yOffset) {
        const frames = mergedIds.has(tile.id)
          ? [{ transform: start }, { transform: 'translate(0, 0) scale(1.09)', offset: .78 }, { transform: 'translate(0, 0) scale(1)' }]
          : [{ transform: start }, { transform: 'translate(0, 0)' }];
        cell.animate(frames, { duration: mergedIds.has(tile.id) ? 190 : 155, easing: 'cubic-bezier(.2,.7,.25,1)' });
      } else if (mergedIds.has(tile.id)) {
        cell.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.11)' },
          { transform: 'scale(1)' }
        ], { duration: 190, easing: 'cubic-bezier(.2,.7,.25,1)' });
      }
    }));
    scoreElement.textContent = String(score);
  };

  const startNewGame = () => {
    board = Array.from({ length: 4 }, () => [null, null, null, null]);
    score = 0;
    won = false;
    nextTileId = 0;
    winElement.classList.add('hidden');
    statusElement.textContent = 'Make a move to begin.';
    randomEmptyCell();
    randomEmptyCell();
    render();
  };

  const showWin = () => {
    won = true;
    statusElement.textContent = 'You reached 2048. You win!';
    winElement.classList.remove('hidden');
    playAgainButton.focus();
  };

  const isGameOver = () => {
    if (board.some((row) => row.includes(null))) return false;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      if ((x < 3 && board[y][x].value === board[y][x + 1].value) || (y < 3 && board[y][x].value === board[y + 1][x].value)) return false;
    }
    return true;
  };

  const move = (direction) => {
    if (won || !dialog.open) return;
    const previousPositions = new Map();
    board.forEach((row, y) => row.forEach((tile, x) => { if (tile) previousPositions.set(tile.id, { x, y }); }));
    const before = board.map((row) => row.map((tile) => tile ? `${tile.id}:${tile.value}` : '0').join(',')).join(';');
    const mergedIds = new Set();
    const lines = [];
    for (let n = 0; n < 4; n++) {
      const line = [];
      for (let step = 0; step < 4; step++) {
        if (direction === 'left') line.push([n, step]);
        if (direction === 'right') line.push([n, 3 - step]);
        if (direction === 'up') line.push([step, n]);
        if (direction === 'down') line.push([3 - step, n]);
      }
      lines.push(line);
    }

    lines.forEach((coordinates) => {
      const values = coordinates.map(([y, x]) => board[y][x]).filter(Boolean);
      const merged = [];
      for (let i = 0; i < values.length; i++) {
        if (values[i].value === values[i + 1]?.value) {
          const tile = { id: values[i].id, value: values[i].value * 2 };
          merged.push(tile);
          mergedIds.add(tile.id);
          const value = tile.value;
          score += value;
          i++;
        } else merged.push(values[i]);
      }
      coordinates.forEach(([y, x], index) => { board[y][x] = merged[index] || null; });
    });

    if (before === board.map((row) => row.map((tile) => tile ? `${tile.id}:${tile.value}` : '0').join(',')).join(';')) return;
    randomEmptyCell();
    render(previousPositions, mergedIds);
    if (board.some((row) => row.some((tile) => tile?.value === 2048))) showWin();
    else if (isGameOver()) statusElement.textContent = 'No moves left. Start a new game.';
    else statusElement.textContent = 'Nice move.';
  };

  document.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    const keys = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    const direction = keys[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  });

  boardElement.addEventListener('pointerdown', (event) => {
    touchStart = { x: event.clientX, y: event.clientY };
  });
  boardElement.addEventListener('pointerup', (event) => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  boardElement.addEventListener('pointercancel', () => { touchStart = null; });

  newButton.addEventListener('click', startNewGame);
  playAgainButton.addEventListener('click', () => { startNewGame(); boardElement.focus(); });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => globe.focus());
  startNewGame();
})();
