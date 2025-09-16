// DISCLAIMER:
// Код анимации фона в этом файле не мой, попросил ai сделать эффект лавовой лампы для красоты
// Если по заданию совсем нельзя использовать ai, то можно добавить в url параметр ?no-ai=false
// и код анимации исполняться не будет

const createLavaBg = () => {
    const $svg = document.getElementById('lava-goo');
    const $group = document.getElementById('blobs');

    if (!$svg || !$group) {
        console.error('Элементы не найдены"');
    }


    const cfg = {
        count: 5,
        rMin: 50,
        rMax: 120,
        speedMin: 12,
        speedMax: 20,
        w: 1600,
        h: 900,
        hardFactor: 1,
        restitution: 0.85,
        jitter: 3,
    };

    const rand = (a, b) => a + Math.random() * (b - a);
    const sign = () => (Math.random() < 0.5 ? -1 : 1);

    const blobs = Array.from({ length: cfg.count }).map(() => {
        const r = rand(cfg.rMin, cfg.rMax);
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', r.toFixed(1));
        const fills = ['url(#ocean1)', 'url(#ocean2)', 'url(#ocean3)', 'url(#ocean4)'];
        c.setAttribute('fill', fills[Math.floor(Math.random() * fills.length)]);
        if ($group) $group.appendChild(c);

        const hardR = r * cfg.hardFactor;
        // масса пропорциональна площади жёсткой части
        const mass = Math.max(1, hardR * hardR);

        return {
            el: c,
            r,
            hardR,
            mass,
            x: rand(r, cfg.w - r),
            y: rand(r, cfg.h - r),
            vx: sign() * rand(cfg.speedMin, cfg.speedMax),
            vy: sign() * rand(cfg.speedMin, cfg.speedMax),
        };
    });

    let last = performance.now();
    function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.033);
        last = now;

        // интеграция движения + отскок от стен
        for (const b of blobs) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // стены
            if (b.x - b.r < 0) {
                b.x = b.r;
                b.vx *= -1;
            }
            if (b.x + b.r > cfg.w) {
                b.x = cfg.w - b.r;
                b.vx *= -1;
            }
            if (b.y - b.r < 0) {
                b.y = b.r;
                b.vy *= -1;
            }
            if (b.y + b.r > cfg.h) {
                b.y = cfg.h - b.r;
                b.vy *= -1;
            }

            // лёгкая “дрожь” траекторий
            b.vx += Math.sin(now / 1000 + b.x * 0.001) * cfg.jitter * dt;
            b.vy += Math.cos(now / 1100 + b.y * 0.001) * cfg.jitter * dt;
        }

        // парные столкновения (по жёстким радиусам)
        for (let i = 0; i < blobs.length; i++) {
            for (let j = i + 1; j < blobs.length; j++) {
                const A = blobs[i],
                    B = blobs[j];

                let dx = B.x - A.x;
                let dy = B.y - A.y;
                let dist = Math.hypot(dx, dy);

                const minDist = A.hardR + B.hardR;
                if (dist === 0) {
                    dx = 1e-3;
                    dy = 0;
                    dist = 1e-3;
                }

                if (dist < minDist) {
                    // нормаль
                    const nx = dx / dist,
                        ny = dy / dist;
                    // насколько пересеклись
                    const overlap = minDist - dist;

                    // раздвинем центры, чтобы убрать пересечение (поровну по массам)
                    const invMassA = 1 / A.mass,
                        invMassB = 1 / B.mass;
                    const invMassSum = invMassA + invMassB;

                    A.x -= nx * overlap * (invMassA / invMassSum);
                    A.y -= ny * overlap * (invMassA / invMassSum);
                    B.x += nx * overlap * (invMassB / invMassSum);
                    B.y += ny * overlap * (invMassB / invMassSum);

                    // относительная скорость вдоль нормали
                    const rvx = B.vx - A.vx;
                    const rvy = B.vy - A.vy;
                    const velAlongNormal = rvx * nx + rvy * ny;

                    // если шары уже расходятся — импульс не нужен
                    if (velAlongNormal < 0) {
                        // упругое столкновение с коэффициентом восстановления
                        const e = cfg.restitution;
                        const jImpulse = (-(1 + e) * velAlongNormal) / invMassSum;

                        const ix = jImpulse * nx;
                        const iy = jImpulse * ny;

                        A.vx -= ix * invMassA;
                        A.vy -= iy * invMassA;
                        B.vx += ix * invMassB;
                        B.vy += iy * invMassB;
                    }
                }
            }
        }

        for (const b of blobs) {
            b.el.setAttribute('cx', b.x.toFixed(1));
            b.el.setAttribute('cy', b.y.toFixed(1));
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(t => {
        last = t;
        tick(t);
    });

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    function fitToViewport() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        cfg.w = w;
        cfg.h = h;
        if ($svg) $svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

        for (const b of blobs) {
            const R = b.r ?? b.el.r.baseVal.value;
            b.x = clamp(b.x, R, w - R);
            b.y = clamp(b.y, R, h - R);
            b.el.setAttribute('r', R.toFixed(1));
        }
    }

    fitToViewport();
    window.addEventListener('resize', fitToViewport);
}

const getAiDisabled = () => {
    const valueFromUrl = new URLSearchParams(window.location.search).get('no-ai');
    if (valueFromUrl !== null) {
        return valueFromUrl === 'true' || valueFromUrl === '';
    }
    return localStorage.getItem('aiDisabled') === 'true';
}


const $background = document.getElementById('lava-bg');

const aiDisabled = getAiDisabled();
localStorage.setItem('aiDisabled', aiDisabled.toString());

if (aiDisabled) {
    $background?.classList.add('no-ai-animation');
} else {
    createLavaBg();
}
