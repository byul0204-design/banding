/* LK 홈타운 밴딩머신 — 사이트 스크립트 (의존성 없음) */
(function () {
  'use strict';

  /* 모바일 메뉴 */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.querySelector('.visually-hidden').textContent = open ? '메뉴 닫기' : '메뉴 열기';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* 냉동 쇼케이스 블록 크기 탭 */
  document.querySelectorAll('.block-grid').forEach(function (grid) {
    var cols = +grid.dataset.cols, rows = +grid.dataset.rows;
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    grid.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)';
    if (grid.dataset.ratio) grid.style.aspectRatio = grid.dataset.ratio;
    for (var i = 0; i < cols * rows; i++) grid.appendChild(document.createElement('span'));
  });

  document.querySelectorAll('[data-blocks]').forEach(function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  });

  /* 문의 폼: Netlify Forms로 전송하고 화면에서 결과 표시 */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (location.protocol === 'file:') return; // 로컬 파일로 열었을 때는 기본 동작
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('button[type="submit"]');
      var data = new FormData(form);
      // 체크박스 여러 개를 한 줄로 합치기
      var products = data.getAll('product');
      data.delete('product');
      data.append('product', products.join(', '));

      btn.disabled = true;
      btn.textContent = '보내는 중…';
      status.className = 'form-status';
      status.textContent = '';

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.className = 'form-status ok';
        status.textContent = '문의가 접수됐어요. 남겨 주신 연락처로 곧 연락드릴게요.';
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = '전송하지 못했어요. 잠시 후 다시 시도하시거나 전화로 문의해 주세요.';
      }).then(function () {
        btn.disabled = false;
        btn.textContent = '문의 보내기';
      });
    });
  }

  /* 글 주소 복사 */
  document.querySelectorAll('[data-copy-url]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-copy-url') || location.href;
      var done = function () {
        var old = btn.textContent;
        btn.textContent = '주소를 복사했어요';
        setTimeout(function () { btn.textContent = old; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done);
      else { window.prompt('아래 주소를 복사하세요', url); }
    });
  });

  /* 연도 */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
