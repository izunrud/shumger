/**
 * ШУМГЕР — Главный скрипт сайта
 * Мобильное меню, анимации, фильтрация портфолио, FAQ, модальные окна и формы
 */

(function () {
  'use strict';

  var app = {};
  window.ShumgerApp = app;

  // Конфигурация моментальных бесплатных уведомлений (Telegram Bot API)
  window.SHUMGER_SETTINGS = window.SHUMGER_SETTINGS || {
    telegram: {
      botToken: '', // Вставьте токен бота от @BotFather (например, '123456789:ABCdef...')
      chatId: ''    // Вставьте ваш chat_id из @userinfobot
    }
  };

  // ==========================================================================
  // 1. Шапка при скролле
  // ==========================================================================
  var header = document.querySelector('.header');
  function handleScroll() {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ==========================================================================
  // 2. Мобильное меню (Drawer)
  // ==========================================================================
  var navToggle = document.querySelector('.nav-toggle');
  var mobileDrawer = document.querySelector('.mobile-drawer');
  var drawerBackdrop = document.querySelector('.mobile-drawer-backdrop');
  var drawerClose = document.querySelector('.drawer-close');

  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('is-open');
    if (drawerBackdrop) drawerBackdrop.classList.add('is-open');
    document.body.classList.add('menu-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('is-open');
    if (drawerBackdrop) drawerBackdrop.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle) {
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (mobileDrawer && mobileDrawer.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  // Закрытие при клике по ссылкам внутри мобильного меню
  document.querySelectorAll('.drawer-link').forEach(function (link) {
    link.addEventListener('click', closeDrawer);
  });

  // ==========================================================================
  // 3. Статичные показатели (Анимация чисел отключена по требованию)
  // ==========================================================================


  // ==========================================================================
  // 4. Плавное появление карточек при скролле
  // ==========================================================================
  function initScrollReveal() {
    var cards = document.querySelectorAll(
      '.feature-card, .service-card, .portfolio-card, .step-item, .standard-card, .stat-card'
    );
    if (!cards.length) return;

    // На мобильных устройствах не скрываем элементы, чтобы не перегружать рендеринг и избежать лагов
    if (window.innerWidth <= 768) {
      cards.forEach(function (card) {
        card.style.opacity = '1';
        card.style.transform = 'none';
      });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(function (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(24px)';
      card.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      revealObserver.observe(card);
    });
  }

  // ==========================================================================
  // 5. Фильтрация карточек портфолио
  // ==========================================================================
  function initPortfolioFilter() {
    var filterBtns = document.querySelectorAll('[data-filter]');
    var projectCards = document.querySelectorAll('.portfolio-card');
    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var category = btn.getAttribute('data-filter');

        var container = btn.parentElement;
        var siblingBtns = container ? container.querySelectorAll('[data-filter]') : filterBtns;
        siblingBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // Аккуратное центрирование кнопки внутри горизонтальной полосы без перехвата скролла экрана
        if (container && container.scrollWidth > container.clientWidth) {
          var btnLeft = btn.offsetLeft;
          var btnWidth = btn.offsetWidth;
          var containerWidth = container.clientWidth;
          var targetScroll = btnLeft - (containerWidth / 2) + (btnWidth / 2);
          container.scrollTo({
            left: Math.max(0, targetScroll),
            behavior: 'smooth'
          });
        }

        // Мгновенная плавная фильтрация без задержек и прыжков высоты страницы
        projectCards.forEach(function (card) {
          var cardCategory = card.getAttribute('data-category');
          if (category === 'all' || cardCategory === category) {
            card.style.display = 'flex';
            card.style.opacity = '1';
            card.style.transform = 'none';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ==========================================================================
  // 6. Модальное окно детализации проекта портфолио
  // ==========================================================================
  var projectModal = document.getElementById('projectModal');
  var projectModalClose = projectModal ? projectModal.querySelector('.modal-close') : null;

  // Данные по проектам портфолио
  var PROJECTS_DATA = {
    'solnechny': {
      title: 'ЖК «Солнечный»',
      category: 'Детский игровой ландшафт',
      image: 'assets/images/projects/project-playground.jpg',
      area: '240 м²',
      term: '8 рабочих дней',
      gost: 'ГОСТ Р 52169-2012',
      desc: 'Комплексный проект детского пространства для жилого квартала комфорт-класса. Установлен двухуровневый игровой комплекс с горками-трубами, безопасными качелями-гнездами и каруселью со скрытым подшипником. Уложено двухслойное бесшовное покрытие EPDM толщиной 20 мм с яркой разметкой и объемной геопластикой холмов.',
      equip: ['Двухуровневый башенный игровой комплекс', 'Качели-гнездо 120 см на усиленных цепях', '3D-холмы и геопластика из крошки EPDM', 'Травмобезопасное бесшовное покрытие 20 мм', 'Зона отдыха для родителей с навесом']
    },
    'pobeda': {
      title: 'Парк «Победы»',
      category: 'Воркаут-комплекс',
      image: 'assets/images/projects/project-workout.jpg',
      area: '320 м²',
      term: '10 рабочих дней',
      gost: 'ГОСТ Р 55677-2013',
      desc: 'Профессиональная спортивная площадка для воркаута и кроссфита. Снаряды изготовлены из толстостенной конструкционной стали 3.5 мм с полимерно-порошковым антивандальным напылением и антикоррозийным цинковым грунтом.',
      equip: ['Каскад из 8 турников различной высоты', 'Разновысотные и параллельные брусья с нескользящим хватом', 'Шведские стенки и рукоход «Змейка»', 'Наклонные скамьи для пресса', 'Информационный стенд с нормативами ГТО']
    },
    'zareche': {
      title: 'Набережная «Заречье»',
      category: 'МАФ и теневые перголы',
      image: 'assets/images/projects/project-maf.jpg',
      area: '180 м²',
      term: '7 рабочих дней',
      gost: 'ГОСТ Р 52299-2013',
      desc: 'Архитектурный ансамбль малых форм для городской набережной. Включает теневые перголы из кортеновской стали с интегрированной контурной LED-подсветкой, парковые скамьи из массива отборной сибирской лиственницы и урны раздельного сбора.',
      equip: ['Теневые перголы из кортеновской стали', 'Влагозащищенная LED-подсветка IP67 с датчиком освещенности', 'Парковые скамьи с брусом из лиственницы экстра', 'Урны раздельного сбора с защитой от осадков', 'Скрытый анкерный монтаж на ж/б ростверк']
    },
    'zarya': {
      title: 'ЖК «Новая Заря»',
      category: 'Монолитные бетонные основания',
      image: 'assets/images/projects/project-foundations.jpg',
      area: '450 м²',
      term: '14 рабочих дней',
      gost: 'СП 63.13330 (Бетон B22.5)',
      desc: 'Устройство армированной монолитной фундаментной плиты толщиной 180 мм под спортивное ядро жилого комплекса. Включает земляные работы, песчано-гравийную подушку, пространственное армирование А500С и ливневый дренаж.',
      equip: ['Песчано-щебеночная подушка 250 мм с послойным виброуплотнением', 'Двухслойное армирование пространственным каркасом А500С', 'Приемка и укладка гидротехнического бетона B22.5 (М300)', 'Интегрированные водоотводные лотки с чугунными решетками', 'Лабораторные испытания набора прочности бетона']
    },
    'molodezhny': {
      title: 'Сквер «Молодёжный»',
      category: 'Эко-городок из робинии',
      image: 'assets/images/projects/project-timber.jpg',
      area: '280 м²',
      term: '9 рабочих дней',
      gost: 'ГОСТ Р 52169-2012',
      desc: 'Природный игровой комплекс из ошкуренных цельных бревен белой робинии. Износостойкая природная древесина, безопасные канатные переходы со стальным сердечником и экологичное амортизирующее основание из фракционной щепы.',
      equip: ['Природный комплекс «Лазалки» из цельных бревен робинии', 'Подвесные канатные мостики со стальным сердечником 16 мм', 'Балансировочные бревна и дорожки из пеньков', 'Амортизирующее основание из окатанной щепы', 'Скрытые оцинкованные закладные стаканы']
    },
    'skandinaviya': {
      title: 'ЖК «Скандинавия»',
      category: 'Бесшовное EPDM покрытие',
      image: 'assets/images/projects/project-epdm.jpg',
      area: '520 м²',
      term: '12 рабочих дней',
      gost: 'ГОСТ Р ЕН 1177 (HIC до 2.6 м)',
      desc: 'Двухслойное бесшовное ударопоглощающее покрытие толщиной 30 мм: нижний демпфирующий слой из SBR-крошки 20 мм и верхний цветной слой из первичного каучука EPDM 10 мм с объемными холмами-геопластикой.',
      equip: ['Нижний амортизирующий слой SBR 20 мм с полиуретановым клеем', 'Верхний УФ-стойкий слой первичного каучука EPDM 10 мм', 'Объемные холмы-геопластика высотой до 80 см', 'Контрастная износостойкая игровая разметка', 'Водопроницаемая структура — отсутствие луж и наледи']
    },
    // Резервные проекты
    'school15': {
      title: 'Школа №15',
      category: 'МАФ и благоустройство',
      image: 'assets/images/projects/project-maf.jpg',
      area: '450 м²',
      term: '12 рабочих дней',
      gost: 'ГОСТ Р 52299-2013',
      desc: 'Благоустройство пришкольной территории с установкой скамей, урн и велопарковок.',
      equip: ['14 парковых скамей из термообработанного ясеня', '8 урн с защитой от осадков', '2 крытые велопарковки на 20 мест']
    },
    'raduga': {
      title: 'Детский сад «Радуга»',
      category: 'Детская площадка',
      image: 'assets/images/projects/project-playground.jpg',
      area: '180 м²',
      term: '6 рабочих дней',
      gost: 'ГОСТ Р 52169-2012',
      desc: 'Безопасное пространство для детей дошкольного возраста.',
      equip: ['Игровой домик с песочницей', 'Мини-горка с бортиками', 'Пружинные качалки']
    },
    'olimp': {
      title: 'Спорткомплекс «Олимп»',
      category: 'Резиновое покрытие',
      image: 'assets/images/projects/project-epdm.jpg',
      area: '500 м²',
      term: '5 рабочих дней',
      gost: 'ГОСТ Р ЕН 1177-2013',
      desc: 'Укладка двухслойного монолитного покрытия EPDM для активных видов спорта.',
      equip: ['Двухслойное бесшовное покрытие EPDM 25 мм', 'Спортивная разметка стойкими красками']
    },
    'riverside': {
      title: 'Набережная «Речной бриз»',
      category: 'Воркаут-зона',
      image: 'assets/images/projects/project-workout.jpg',
      area: '280 м²',
      term: '7 рабочих дней',
      gost: 'ГОСТ Р 55677-2013',
      desc: 'Спортивная воркаут-зона с видом на воду и морской антикоррозийной защитой.',
      equip: ['Уличные силовые тренажёры', 'Турники и брусья с антискользящим хватом']
    }
  };

  function openProjectModal(projectId) {
    if (!projectModal) return;
    var data = PROJECTS_DATA[projectId] || PROJECTS_DATA['solnechny'];

    var titleEl = projectModal.querySelector('[data-modal-title]');
    var catEl = projectModal.querySelector('[data-modal-cat]');
    var areaEl = projectModal.querySelector('[data-modal-area]');
    var termEl = projectModal.querySelector('[data-modal-term]');
    var gostEl = projectModal.querySelector('[data-modal-gost]');
    var descEl = projectModal.querySelector('[data-modal-desc]');
    var listEl = projectModal.querySelector('[data-modal-list]');
    var ctaBtn = projectModal.querySelector('[data-modal-cta]');
    var imgEl = projectModal.querySelector('[data-modal-img]');

    if (titleEl) titleEl.textContent = data.title;
    if (catEl) catEl.textContent = data.category;
    if (areaEl) areaEl.textContent = data.area;
    if (termEl) termEl.textContent = data.term;
    if (gostEl) gostEl.textContent = data.gost;
    if (descEl) descEl.textContent = data.desc;

    if (imgEl && data.image) {
      imgEl.src = data.image;
      imgEl.alt = data.title;
    }

    if (listEl) {
      listEl.innerHTML = '';
      if (Array.isArray(data.equip)) {
        data.equip.forEach(function (item) {
          var li = document.createElement('li');
          li.textContent = item;
          listEl.appendChild(li);
        });
      }
    }

    if (ctaBtn) {
      ctaBtn.onclick = function () {
        closeProjectModal();
        app.openLeadModal('Интересует проект: ' + data.title);
      };
    }

    projectModal.classList.add('is-open');
    document.body.classList.add('menu-open');
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    document.body.classList.remove('modal-open');
  }

  if (projectModalClose) {
    projectModalClose.addEventListener('click', closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener('click', function (e) {
      if (e.target === projectModal) closeProjectModal();
    });
  }

  // Привязка кликов к карточкам портфолио
  document.querySelectorAll('[data-project-id]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      var id = card.getAttribute('data-project-id');
      openProjectModal(id);
    });
  });

  // ==========================================================================
  // 7. Аккордеон FAQ
  // ==========================================================================
  function initFaq() {
    var faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(function (item) {
      var trigger = item.querySelector('.faq-trigger');
      var content = item.querySelector('.faq-content');

      if (!trigger || !content) return;

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-active');

        // Закрываем остальные для опрятности
        faqItems.forEach(function (other) {
          if (other !== item) {
            other.classList.remove('is-active');
            var otherContent = other.querySelector('.faq-content');
            if (otherContent) otherContent.style.maxHeight = null;
            var otherTrigger = other.querySelector('.faq-trigger');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('is-active');
          content.style.maxHeight = null;
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-active');
          content.style.maxHeight = content.scrollHeight + 'px';
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ==========================================================================
  // 8. Модальное окно заявки (Lead Modal) & Toast уведомления
  // ==========================================================================
  var leadModal = document.getElementById('leadModal');
  var leadModalClose = leadModal ? leadModal.querySelector('.modal-close') : null;
  var leadModalContextInput = leadModal ? leadModal.querySelector('input[name="lead_context"]') : null;

  app.openLeadModal = function (contextTitle) {
    if (!leadModal) return;
    if (leadModalContextInput && contextTitle) {
      leadModalContextInput.value = contextTitle;
    }
    var modalHeading = leadModal.querySelector('.modal-lead-title');
    if (modalHeading && contextTitle) {
      modalHeading.textContent = contextTitle.indexOf('Расчёт:') === 0 ? 'Получить смету по расчёту' : 'Оставить заявку';
    }
    leadModal.classList.add('is-open');
    document.body.classList.add('menu-open');
  };

  app.closeLeadModal = function () {
    if (!leadModal) return;
    leadModal.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    document.body.classList.remove('modal-open');
  };

  if (leadModalClose) {
    leadModalClose.addEventListener('click', app.closeLeadModal);
  }

  if (leadModal) {
    leadModal.addEventListener('click', function (e) {
      if (e.target === leadModal) app.closeLeadModal();
    });
  }

  // Триггеры для открытия модалки заявки
  document.querySelectorAll('[data-lead-trigger]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var context = btn.getAttribute('data-lead-trigger') || 'Общая заявка';
      app.openLeadModal(context);
    });
  });

  // Всплывающее уведомление (Toast)
  app.showToast = function (message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--color-primary); flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg><span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 4500);
  };

  // ==========================================================================
  // 9. Маска телефонного номера (+7 (XXX) XXX-XX-XX)
  // ==========================================================================
  function initPhoneMasks() {
    var phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(function (input) {
      input.addEventListener('input', function (e) {
        var value = e.target.value.replace(/\D/g, '');
        if (!value.length) {
          e.target.value = '';
          return;
        }

        if (value[0] === '7' || value[0] === '8') {
          value = value.substring(1);
        }

        var formatted = '+7';
        if (value.length > 0) {
          formatted += ' (' + value.substring(0, 3);
        }
        if (value.length >= 4) {
          formatted += ') ' + value.substring(3, 6);
        }
        if (value.length >= 7) {
          formatted += '-' + value.substring(6, 8);
        }
        if (value.length >= 9) {
          formatted += '-' + value.substring(8, 10);
        }

        e.target.value = formatted;
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && e.target.value === '+7 ') {
          e.target.value = '';
        }
      });
    });
  }

  // ==========================================================================
  // 10. Обработка отправки форм
  // ==========================================================================
  function initFormHandlers() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      // Исключаем поисковые если появятся
      if (form.getAttribute('data-no-ajax')) return;

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var phoneInput = form.querySelector('input[type="tel"]');
        if (phoneInput && phoneInput.value.trim().length < 16) {
          alert('Пожалуйста, введите корректный номер телефона для связи.');
          phoneInput.focus();
          return;
        }

        var formData = new FormData(form);
        var data = Object.fromEntries(formData.entries());

        // Формирование текста для резервной отправки
        var subject = 'Заявка с сайта ШУМГЕР: ' + (data.lead_context || 'Консультация');
        var messenger = data.messenger || 'Телефон';
        var body = 'Имя: ' + (data.name || 'Не указано') + '\n' +
                   'Телефон: ' + (data.phone || 'Не указан') + '\n' +
                   'Предпочтительный канал связи: ' + messenger + '\n' +
                   'Контекст: ' + (data.lead_context || 'Прямая заявка') + '\n' +
                   'Сообщение: ' + (data.message || data.description || '—');

        // Сохраняем лид в localStorage для гарантии сохранения данных
        try {
          var savedLeads = JSON.parse(localStorage.getItem('shumger_leads') || '[]');
          data.timestamp = new Date().toLocaleString('ru-RU');
          savedLeads.push(data);
          localStorage.setItem('shumger_leads', JSON.stringify(savedLeads));
        } catch (storageErr) {}

        // Мгновенная бесплатная отправка в Telegram владельца (0 руб)
        try {
          var tgConfig = window.SHUMGER_SETTINGS && window.SHUMGER_SETTINGS.telegram;
          if (tgConfig && tgConfig.botToken && tgConfig.chatId) {
            var tgText = '🔔 <b>Новая заявка с сайта ШУМГЕР</b>\n\n' +
                         '👤 <b>Имя:</b> ' + (data.name || 'Не указано') + '\n' +
                         '📞 <b>Телефон:</b> ' + (data.phone || 'Не указан') + '\n' +
                         '💬 <b>Канал связи:</b> ' + messenger + '\n' +
                         '📍 <b>Контекст:</b> ' + (data.lead_context || 'Прямая заявка') + '\n' +
                         (data.message || data.description ? '📝 <b>Сообщение:</b> ' + (data.message || data.description) + '\n' : '') +
                         '⏱ <i>' + (data.timestamp || new Date().toLocaleString('ru-RU')) + '</i>';

            fetch('https://api.telegram.org/bot' + tgConfig.botToken + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: tgConfig.chatId,
                text: tgText,
                parse_mode: 'HTML'
              })
            }).catch(function (err) {
              console.warn('Telegram send status:', err);
            });
          }
        } catch (tgErr) {}

        // Показываем подтверждение
        app.showToast('Спасибо за заявку! Инженер свяжется с вами в течение 15 минут.');
        form.reset();

        if (leadModal && leadModal.classList.contains('is-open')) {
          app.closeLeadModal();
        }

        // Опциональный переход на mailto в фоне без поломки UX
        try {
          var mailtoUrl = 'mailto:info@shumger.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        } catch (err) {}
      });
    });
  }

  // Вспомогательный метод просмотра сохраненных заявок
  app.getLeads = function () {
    try {
      return JSON.parse(localStorage.getItem('shumger_leads') || '[]');
    } catch (e) {
      return [];
    }
  };


  // ==========================================================================
  // 11. Плавающий виджет быстрой связи (FAB)
  // ==========================================================================
  function initFab() {
    var fab = document.querySelector('.quick-contact-fab');
    if (!fab) return;

    var mainBtn = fab.querySelector('.fab-main-btn');
    if (!mainBtn) return;

    mainBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      fab.classList.toggle('is-active');
    });

    document.addEventListener('click', function (e) {
      if (!fab.contains(e.target)) {
        fab.classList.remove('is-active');
      }
    });
  }

  // ==========================================================================
  // 12. Глобальная клавиатурная навигация (Escape)
  // ==========================================================================
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      closeProjectModal();
      app.closeLeadModal();
      document.body.classList.remove('menu-open');
      document.body.classList.remove('modal-open');
      var fab = document.querySelector('.quick-contact-fab');
      if (fab) fab.classList.remove('is-active');
    }
  });

  // ==========================================================================
  // 13. Интерактивная навигация по услугам (Sticky Filter Nav) — 60-120 FPS Mobile
  // ==========================================================================
  function initServicesStickyNav() {
    var pillsContainer = document.getElementById('servicesFilterPills');
    if (!pillsContainer) return;

    var pills = pillsContainer.querySelectorAll('.services-filter-pill');
    var serviceCards = document.querySelectorAll('.service-card-compact[id], .service-card[id]');
    if (!pills.length || !serviceCards.length) return;

    var isManualClick = false;
    var manualClickTimeout = null;
    var activeId = null;
    var scrollAlignTimeout = null;

    function centerPill(pill, smooth) {
      if (!pill || pillsContainer.scrollWidth <= pillsContainer.clientWidth) return;
      var pillLeft = pill.offsetLeft;
      var pillWidth = pill.offsetWidth;
      var containerWidth = pillsContainer.clientWidth;
      var targetScroll = pillLeft - (containerWidth / 2) + (pillWidth / 2);
      pillsContainer.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: smooth ? 'smooth' : 'auto'
      });
    }

    function setActivePill(targetId, shouldCenter) {
      if (activeId === targetId) return;
      activeId = targetId;

      var matchedPill = null;
      pills.forEach(function (p) {
        if (p.getAttribute('href') === '#' + targetId) {
          p.classList.add('active');
          matchedPill = p;
        } else {
          p.classList.remove('active');
        }
      });

      // Во время скролла страницы пальцем НЕ дергаем скролл ленты!
      // Центрируем только при явном клике или с задержкой после остановки скролла
      if (shouldCenter && matchedPill) {
        centerPill(matchedPill, true);
      }
    }

    // Быстрый точный переход при клике
    pills.forEach(function (pill) {
      pill.addEventListener('click', function (e) {
        var targetId = pill.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          var cleanId = targetId.substring(1);
          var targetEl = document.getElementById(cleanId);
          if (targetEl) {
            e.preventDefault();
            isManualClick = true;
            clearTimeout(manualClickTimeout);

            setActivePill(cleanId, true);

            // Динамический точный расчет высоты шапки и бара
            var headerEl = document.querySelector('.header');
            var navEl = document.querySelector('.services-sticky-nav');
            var headerH = headerEl ? headerEl.offsetHeight : 58;
            var navH = navEl ? navEl.offsetHeight : 44;
            var offset = headerH + navH + 10;

            var bodyRect = document.body.getBoundingClientRect().top;
            var elementRect = targetEl.getBoundingClientRect().top;
            var offsetPosition = (elementRect - bodyRect) - offset;

            window.scrollTo({
              top: Math.max(0, Math.round(offsetPosition)),
              behavior: 'smooth'
            });

            manualClickTimeout = setTimeout(function () {
              isManualClick = false;
            }, 850);
          }
        }
      });
    });

    // Отслеживание текущего раздела при скролле без фризов
    if ('IntersectionObserver' in window) {
      var visibleMap = {};
      var observer = new IntersectionObserver(function (entries) {
        if (isManualClick) return;
        entries.forEach(function (entry) {
          visibleMap[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });

        var bestId = null;
        var maxRatio = 0;
        for (var id in visibleMap) {
          if (visibleMap[id] > maxRatio) {
            maxRatio = visibleMap[id];
            bestId = id;
          }
        }

        if (bestId && maxRatio > 0.15) {
          // Тихо подсвечиваем активную кнопку БЕЗ вызова scrollIntoView
          setActivePill(bestId, false);

          // Мягко центрируем ленту только после полной остановки скролла
          clearTimeout(scrollAlignTimeout);
          scrollAlignTimeout = setTimeout(function () {
            if (!isManualClick) {
              var activePill = pillsContainer.querySelector('.services-filter-pill.active');
              if (activePill) centerPill(activePill, true);
            }
          }, 350);
        }
      }, {
        threshold: [0.2],
        rootMargin: '-100px 0px -40% 0px'
      });

      serviceCards.forEach(function (card) {
        observer.observe(card);
      });
    }
  }

  // Инициализация компонентов при готовности DOM
  document.addEventListener('DOMContentLoaded', function () {
    initScrollReveal();
    initPortfolioFilter();
    initFaq();
    initPhoneMasks();
    initFormHandlers();
    initFab();
    initServicesStickyNav();
  });

})();
