/* ==========================================================================
   Procrastination Roulette: main.js
   Vanilla JS: roulette logic, custom tasks, history, localStorage.
   ========================================================================== */

(() => {
    'use strict';

    /* ---------------------------------------------------------------------
       Constants & data
    --------------------------------------------------------------------- */
    const STORAGE_KEY = 'procrastinationRoulette.v1';
    const MAX_HISTORY = 50;
    const MAX_CUSTOM = 50;
    const MAX_TASK_LENGTH = 80;

    const CATEGORIES = {
        productivity: { label: 'Productivity', emoji: '🚀' },
        health: { label: 'Health', emoji: '💪' },
        learning: { label: 'Learning', emoji: '📚' },
        cleaning: { label: 'Cleaning', emoji: '🧹' },
        fun: { label: 'Fun', emoji: '🎉' },
    };

    const DEFAULT_TASKS = {
        productivity: [
            { emoji: '📝', text: 'Write down your top 3 priorities for today' },
            { emoji: '📬', text: 'Clear out your inbox for 10 minutes' },
            { emoji: '⏱️', text: 'Do a 25-minute focus sprint on your hardest task' },
            { emoji: '🗂️', text: 'Organize your desktop and downloads folder' },
            { emoji: '📅', text: "Plan tomorrow's schedule" },
            { emoji: '✉️', text: 'Send that email you have been avoiding' },
            { emoji: '🎯', text: 'Break one big task into 5 tiny steps' },
            { emoji: '🔕', text: 'Silence notifications and work for 15 minutes' },
        ],
        health: [
            { emoji: '💧', text: 'Drink a full glass of water' },
            { emoji: '🚶', text: 'Take a 10-minute walk outside' },
            { emoji: '🧘', text: 'Do 5 minutes of stretching' },
            { emoji: '🫁', text: 'Try 10 slow, deep breaths' },
            { emoji: '🥗', text: 'Prepare a healthy snack' },
            { emoji: '🏋️', text: 'Do 20 squats or push-ups' },
            { emoji: '😴', text: 'Set a bedtime alarm for tonight' },
            { emoji: '👀', text: 'Rest your eyes: look 20 feet away for 20 seconds' },
        ],
        learning: [
            { emoji: '📖', text: 'Read 10 pages of a book' },
            { emoji: '🧠', text: 'Learn 5 new words in a language you study' },
            { emoji: '🎧', text: 'Listen to an educational podcast episode' },
            { emoji: '💡', text: 'Watch a short tutorial on a skill you want' },
            { emoji: '✍️', text: 'Summarize something you learned this week' },
            { emoji: '💻', text: 'Solve one small coding challenge' },
            { emoji: '🗺️', text: 'Research a topic you have always been curious about' },
            { emoji: '🃏', text: 'Review your flashcards or notes for 10 minutes' },
        ],
        cleaning: [
            { emoji: '🛏️', text: 'Make your bed' },
            { emoji: '🍽️', text: 'Wash the dishes in the sink' },
            { emoji: '🧺', text: 'Start a load of laundry' },
            { emoji: '🗑️', text: 'Take out the trash and recycling' },
            { emoji: '🪟', text: 'Wipe down your desk and screen' },
            { emoji: '🧽', text: 'Clean the bathroom sink and mirror' },
            { emoji: '👕', text: 'Put away 10 items that are out of place' },
            { emoji: '🧹', text: 'Vacuum or sweep one room' },
        ],
        fun: [
            { emoji: '🎶', text: 'Put on your favorite playlist and dance for one song' },
            { emoji: '🎨', text: 'Doodle or sketch something for 10 minutes' },
            { emoji: '🎮', text: 'Play a quick round of your favorite game' },
            { emoji: '📞', text: 'Call or text a friend just to say hi' },
            { emoji: '🍪', text: 'Bake or cook something you enjoy' },
            { emoji: '📸', text: 'Take 5 photos of interesting things around you' },
            { emoji: '🧩', text: 'Do a puzzle or a brain teaser' },
            { emoji: '🌅', text: 'Step outside and watch the sky for a few minutes' },
        ],
    };

    const MESSAGES = {
        productivity: [
            'Small steps beat perfect plans. Start now!',
            'Future you is already saying thank you.',
            'Momentum starts with the first minute.',
            'Done is better than perfect. Go!',
        ],
        health: [
            'Your body will thank you later.',
            'A healthier you is built one small habit at a time.',
            'Take care of yourself. You deserve it!',
            'Tiny healthy choices add up fast.',
        ],
        learning: [
            'Every expert was once a beginner.',
            'Curiosity is your superpower. Feed it!',
            'A little learning every day goes a long way.',
            'Your brain loves a new challenge.',
        ],
        cleaning: [
            'A tidy space makes a clearer mind.',
            'Ten minutes now saves an hour later.',
            'Future you will love walking into a clean room.',
            'Start small. The mess will shrink fast!',
        ],
        fun: [
            'Fun counts as progress too. Enjoy it!',
            'Rest and play make you sharper.',
            'You earned this. Go have a good time!',
            'Joy is productive. Do it with a smile.',
        ],
    };

    const GENERIC_MESSAGES = [
        "You've got this. Just begin!",
        'Two minutes is all it takes to get started.',
        'The best time to start is right now.',
    ];

    const COMPLETE_TOASTS = [
        'Nice work! Task completed 🎉',
        'Boom! One less thing to avoid 💥',
        'Procrastination defeated! 🏆',
        'Look at you getting things done ✨',
    ];

    /* ---------------------------------------------------------------------
       DOM references
    --------------------------------------------------------------------- */
    const $ = (selector) => document.querySelector(selector);

    const els = {
        spinWrap: $('.spin-wrap'),
        spinBtn: $('#spin-btn'),
        againBtn: $('#again-btn'),
        completeBtn: $('#complete-btn'),
        chips: document.querySelectorAll('.chip'),

        resultEmpty: $('#result-empty'),
        resultBody: $('#result-body'),
        resultEmoji: $('#result-emoji'),
        resultCategory: $('#result-category'),
        resultTask: $('#result-task'),
        resultMessage: $('#result-message'),

        form: $('#task-form'),
        taskInput: $('#task-input'),
        taskCategory: $('#task-category'),
        formError: $('#form-error'),
        customList: $('#custom-list'),
        customEmpty: $('#custom-empty'),
        customCount: $('#custom-count'),

        historyList: $('#history-list'),
        historyEmpty: $('#history-empty'),
        clearHistory: $('#clear-history'),

        statSpins: $('#stat-spins'),
        statCompleted: $('#stat-completed'),
        statRate: $('#stat-rate'),

        toast: $('#toast'),
        srStatus: $('#sr-status'),
    };

    /* ---------------------------------------------------------------------
       State & persistence
    --------------------------------------------------------------------- */
    const state = {
        custom: [],          // { id, text, category }
        history: [],         // newest first: { id, emoji, text, category, custom, message, ts, completed }
        stats: { spins: 0, completed: 0 },
        currentId: null,
        filter: 'all',
    };

    let spinning = false;
    let spinTimer = null;
    let toastTimer = null;

    const isValidCategory = (c) => Object.prototype.hasOwnProperty.call(CATEGORIES, c);
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const prefersReducedMotion = () =>
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return;

            if (Array.isArray(data.custom)) {
                state.custom = data.custom
                    .filter((t) => t && typeof t.text === 'string' && isValidCategory(t.category))
                    .slice(0, MAX_CUSTOM)
                    .map((t) => ({
                        id: typeof t.id === 'string' ? t.id : uid(),
                        text: t.text.slice(0, MAX_TASK_LENGTH),
                        category: t.category,
                    }));
            }

            if (Array.isArray(data.history)) {
                state.history = data.history
                    .filter((h) => h && typeof h.text === 'string' && isValidCategory(h.category))
                    .slice(0, MAX_HISTORY)
                    .map((h) => ({
                        id: typeof h.id === 'string' ? h.id : uid(),
                        emoji: typeof h.emoji === 'string' ? h.emoji : CATEGORIES[h.category].emoji,
                        text: h.text,
                        category: h.category,
                        custom: Boolean(h.custom),
                        message: typeof h.message === 'string' ? h.message : '',
                        ts: Number(h.ts) || Date.now(),
                        completed: Boolean(h.completed),
                    }));
            }

            if (data.stats && typeof data.stats === 'object') {
                state.stats.spins = Math.max(0, Number(data.stats.spins) || 0);
                state.stats.completed = Math.max(0, Number(data.stats.completed) || 0);
            }

            if (typeof data.currentId === 'string' && state.history.some((h) => h.id === data.currentId)) {
                state.currentId = data.currentId;
            }

            if (data.filter === 'all' || isValidCategory(data.filter)) {
                state.filter = data.filter;
            }
        } catch (err) {
            // Corrupt or unavailable storage: start fresh.
            console.warn('Could not read saved data:', err);
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn('Could not save data:', err);
        }
    }

    /* ---------------------------------------------------------------------
       Helpers
    --------------------------------------------------------------------- */
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function formatTime(ts) {
        return new Date(ts).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getMessage(category) {
        const pool = MESSAGES[category] ? MESSAGES[category].concat(GENERIC_MESSAGES) : GENERIC_MESSAGES;
        return randomItem(pool);
    }

    function getPool() {
        const categories = state.filter === 'all' ? Object.keys(CATEGORIES) : [state.filter];
        const pool = [];
        categories.forEach((category) => {
            DEFAULT_TASKS[category].forEach((t) =>
                pool.push({ emoji: t.emoji, text: t.text, category, custom: false })
            );
            state.custom
                .filter((t) => t.category === category)
                .forEach((t) =>
                    pool.push({ emoji: CATEGORIES[category].emoji, text: t.text, category, custom: true })
                );
        });
        return pool;
    }

    function getCurrent() {
        return state.history.find((h) => h.id === state.currentId) || null;
    }

    function toast(message) {
        els.toast.textContent = message;
        els.toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
    }

    function bump(node) {
        node.classList.remove('bump');
        void node.offsetWidth; // restart animation
        node.classList.add('bump');
    }

    /* ---------------------------------------------------------------------
       Rendering
    --------------------------------------------------------------------- */
    function renderFilters() {
        els.chips.forEach((chip) => {
            chip.setAttribute('aria-pressed', String(chip.dataset.filter === state.filter));
        });
    }

    function renderStats() {
        const { spins, completed } = state.stats;
        const rate = spins > 0 ? Math.round((completed / spins) * 100) : 0;

        const prev = {
            spins: els.statSpins.textContent,
            completed: els.statCompleted.textContent,
        };

        els.statSpins.textContent = String(spins);
        els.statCompleted.textContent = String(completed);
        els.statRate.textContent = rate + '%';

        if (prev.spins !== String(spins)) bump(els.statSpins);
        if (prev.completed !== String(completed)) bump(els.statCompleted);
    }

    function renderResult() {
        const entry = getCurrent();

        if (!entry) {
            els.resultEmpty.hidden = false;
            els.resultBody.hidden = true;
            return;
        }

        els.resultEmpty.hidden = true;
        els.resultBody.hidden = false;
        els.resultBody.classList.toggle('done', entry.completed);

        els.resultEmoji.textContent = entry.emoji;
        els.resultTask.textContent = entry.text;
        els.resultMessage.textContent = entry.completed
            ? 'Completed. Great job, you beat procrastination!'
            : entry.message;

        els.resultCategory.textContent = CATEGORIES[entry.category].label;
        els.resultCategory.classList.toggle('custom', entry.custom);

        els.completeBtn.disabled = entry.completed;
        els.completeBtn.textContent = entry.completed ? '🏆 Completed!' : '✅ Mark as completed';
        els.completeBtn.setAttribute(
            'aria-label',
            entry.completed ? 'Task already completed' : 'Mark the selected task as completed'
        );
    }

    function renderCustom() {
        els.customList.textContent = '';
        els.customCount.textContent = String(state.custom.length);
        els.customEmpty.hidden = state.custom.length > 0;

        state.custom.forEach((task) => {
            const li = el('li', 'list-item');
            li.appendChild(el('span', 'item-emoji', CATEGORIES[task.category].emoji));

            const main = el('div', 'item-main');
            main.appendChild(el('div', 'item-text', task.text));
            main.appendChild(el('div', 'item-meta', CATEGORIES[task.category].label));
            li.appendChild(main);

            const del = el('button', 'icon-btn delete', '✕');
            del.type = 'button';
            del.setAttribute('aria-label', 'Delete custom task: ' + task.text);
            del.dataset.id = task.id;
            li.appendChild(del);

            els.customList.appendChild(li);
        });
    }

    function renderHistory() {
        els.historyList.textContent = '';
        els.historyEmpty.hidden = state.history.length > 0;
        els.clearHistory.disabled = state.history.length === 0;

        state.history.forEach((entry) => {
            const li = el('li', 'list-item' + (entry.completed ? ' is-done' : ''));
            li.appendChild(el('span', 'item-emoji', entry.emoji));

            const main = el('div', 'item-main');
            main.appendChild(el('div', 'item-text', entry.text));
            main.appendChild(
                el('div', 'item-meta', CATEGORIES[entry.category].label + ' · ' + formatTime(entry.ts))
            );
            li.appendChild(main);

            li.appendChild(
                el('span', 'status ' + (entry.completed ? 'done' : 'pending'), entry.completed ? 'Done' : 'Pending')
            );

            if (!entry.completed) {
                const check = el('button', 'icon-btn check', '✓');
                check.type = 'button';
                check.dataset.id = entry.id;
                check.setAttribute('aria-label', 'Mark as completed: ' + entry.text);
                li.appendChild(check);
            }

            els.historyList.appendChild(li);
        });
    }

    function renderAll() {
        renderFilters();
        renderStats();
        renderResult();
        renderCustom();
        renderHistory();
    }

    /* ---------------------------------------------------------------------
       Roulette
    --------------------------------------------------------------------- */
    function setSpinningUI(isSpinning) {
        els.spinWrap.classList.toggle('is-spinning', isSpinning);
        els.resultBody.classList.toggle('is-spinning', isSpinning);

        [els.spinBtn, els.againBtn].forEach((btn) => {
            btn.setAttribute('aria-disabled', String(isSpinning));
            btn.setAttribute('aria-busy', String(isSpinning));
        });

        els.spinBtn.querySelector('.spin-label').textContent = isSpinning ? '...' : 'SPIN';
    }

    function showReelFrame(item) {
        els.resultEmpty.hidden = true;
        els.resultBody.hidden = false;
        els.resultBody.classList.remove('done', 'reveal', 'celebrate');
        els.resultEmoji.textContent = item.emoji;
        els.resultTask.textContent = item.text;
        els.resultCategory.textContent = CATEGORIES[item.category].label;
        els.resultCategory.classList.toggle('custom', item.custom);
        els.resultMessage.textContent = '';
        els.completeBtn.disabled = true;
    }

    function pickFinal(pool) {
        const last = getCurrent();
        let candidates = pool;
        if (last && pool.length > 1) {
            const filtered = pool.filter((t) => !(t.text === last.text && t.category === last.category));
            if (filtered.length) candidates = filtered;
        }
        return randomItem(candidates);
    }

    function spin() {
        if (spinning) return;

        const pool = getPool();
        if (!pool.length) return;

        spinning = true;
        setSpinningUI(true);

        const final = pickFinal(pool);
        const totalTime = prefersReducedMotion() ? 500 : 2200;
        let elapsed = 0;
        let delay = 70;

        const tick = () => {
            if (elapsed >= totalTime) {
                finishSpin(final);
                return;
            }
            showReelFrame(randomItem(pool));
            elapsed += delay;
            delay = Math.round(delay * 1.13); // decelerate like a real wheel
            spinTimer = setTimeout(tick, delay);
        };

        tick();
    }

    function finishSpin(item) {
        clearTimeout(spinTimer);

        const entry = {
            id: uid(),
            emoji: item.emoji,
            text: item.text,
            category: item.category,
            custom: item.custom,
            message: getMessage(item.category),
            ts: Date.now(),
            completed: false,
        };

        state.history.unshift(entry);
        if (state.history.length > MAX_HISTORY) state.history.length = MAX_HISTORY;
        state.stats.spins += 1;
        state.currentId = entry.id;

        spinning = false;
        setSpinningUI(false);
        saveState();
        renderAll();

        // Replay the reveal animation.
        els.resultBody.classList.remove('reveal');
        void els.resultBody.offsetWidth;
        els.resultBody.classList.add('reveal');

        els.srStatus.textContent =
            'Your task: ' + entry.text + '. Category: ' + CATEGORIES[entry.category].label + '.';
    }

    /* ---------------------------------------------------------------------
       Task completion
    --------------------------------------------------------------------- */
    function completeEntry(id) {
        const entry = state.history.find((h) => h.id === id);
        if (!entry || entry.completed) return;

        entry.completed = true;
        state.stats.completed += 1;
        saveState();
        renderAll();

        if (entry.id === state.currentId) {
            els.resultBody.classList.remove('reveal', 'celebrate');
            void els.resultBody.offsetWidth;
            els.resultBody.classList.add('celebrate');
        }

        toast(randomItem(COMPLETE_TOASTS));
    }

    /* ---------------------------------------------------------------------
       Custom tasks
    --------------------------------------------------------------------- */
    function addCustomTask(text, category) {
        const clean = text.replace(/\s+/g, ' ').trim();

        if (!clean) return 'Please enter a task description.';
        if (clean.length > MAX_TASK_LENGTH) return 'Keep it under ' + MAX_TASK_LENGTH + ' characters.';
        if (!isValidCategory(category)) return 'Please choose a category.';
        if (state.custom.length >= MAX_CUSTOM) return 'You can save up to ' + MAX_CUSTOM + ' custom tasks.';

        const lower = clean.toLowerCase();
        const duplicate =
            state.custom.some((t) => t.category === category && t.text.toLowerCase() === lower) ||
            DEFAULT_TASKS[category].some((t) => t.text.toLowerCase() === lower);
        if (duplicate) return 'That task already exists in this category.';

        state.custom.push({ id: uid(), text: clean, category });
        saveState();
        renderCustom();
        return '';
    }

    function deleteCustomTask(id) {
        const index = state.custom.findIndex((t) => t.id === id);
        if (index === -1) return;
        const [removed] = state.custom.splice(index, 1);
        saveState();
        renderCustom();
        toast('Removed: ' + removed.text);
    }

    /* ---------------------------------------------------------------------
       Event wiring
    --------------------------------------------------------------------- */
    function bindEvents() {
        els.spinBtn.addEventListener('click', spin);
        els.againBtn.addEventListener('click', spin);

        els.completeBtn.addEventListener('click', () => {
            if (state.currentId && !spinning) completeEntry(state.currentId);
        });

        els.chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                if (spinning) return;
                state.filter = chip.dataset.filter;
                saveState();
                renderFilters();
                const label = state.filter === 'all' ? 'all categories' : CATEGORIES[state.filter].label;
                toast('Spinning from: ' + label);
            });
        });

        els.form.addEventListener('submit', (event) => {
            event.preventDefault();
            const error = addCustomTask(els.taskInput.value, els.taskCategory.value);
            els.formError.textContent = error;

            if (error) {
                els.taskInput.focus();
                return;
            }

            toast('Task added to the roulette ✨');
            els.taskInput.value = '';
            els.taskInput.focus();
        });

        els.taskInput.addEventListener('input', () => {
            els.formError.textContent = '';
        });

        els.customList.addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-id]');
            if (btn) deleteCustomTask(btn.dataset.id);
        });

        els.historyList.addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-id]');
            if (btn && !spinning) completeEntry(btn.dataset.id);
        });

        els.clearHistory.addEventListener('click', () => {
            if (!state.history.length || spinning) return;
            if (!window.confirm('Clear your session history and stats? Custom tasks will be kept.')) return;

            state.history = [];
            state.stats = { spins: 0, completed: 0 };
            state.currentId = null;
            saveState();
            renderAll();
            toast('History cleared');
        });

        // Keyboard shortcut: press "S" to spin (ignored while typing).
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() !== 's') return;
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            const target = event.target;
            const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return;

            event.preventDefault();
            spin();
        });
    }

    /* ---------------------------------------------------------------------
       Init
    --------------------------------------------------------------------- */
    function init() {
        loadState();
        renderAll();
        bindEvents();
    }

    init();
})();