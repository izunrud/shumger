/**
 * ШУМГЕР — Интерактивный калькулятор стоимости монтажа площадок и благоустройства
 * Расчёт сметы по ГОСТ, параметров площади, оборудования, оснований и доп. опций
 * Поддержка URL-параметров (?type=..., ?area=...), пресетов, копирования спецификации
 */

(function () {
  'use strict';

  // Базовые ставки по типам объектов (руб / м²)
  var BASE_RATES = {
    kids: {
      name: 'Детская игровая площадка',
      badge: 'ГОСТ Р 52169-2012',
      basePrice: 4800,
      equipRatio: 0.55,
      surfRatio: 0.25,
      workRatio: 0.20,
      daysPer100m: 4
    },
    workout: {
      name: 'Воркаут / Спортивная площадка',
      badge: 'ГОСТ Р 55677-2013',
      basePrice: 3900,
      equipRatio: 0.50,
      surfRatio: 0.25,
      workRatio: 0.25,
      daysPer100m: 3
    },
    maf: {
      name: 'МАФ и парковые зоны',
      badge: 'Благоустройство',
      basePrice: 3100,
      equipRatio: 0.60,
      surfRatio: 0.15,
      workRatio: 0.25,
      daysPer100m: 3
    },
    rubber: {
      name: 'Бесшовное EPDM покрытие',
      badge: 'ГОСТ Р ЕН 1177',
      basePrice: 2400,
      equipRatio: 0.10,
      surfRatio: 0.65,
      workRatio: 0.25,
      daysPer100m: 2
    }
  };

  // Расценки подготовки основания (руб / м²)
  var FOUNDATION_RATES = {
    ready: 0,
    existing: 0,
    gravel: 750,
    sand_gravel: 750,
    ground: 1800,
    concrete: 1800
  };

  // Коэффициенты класса комплектации
  var TIER_MULTIPLIERS = {
    standard: 1.0,
    comfort: 1.25,
    premium: 1.60
  };

  // Стоимость дополнительных строительных опций (руб)
  var ADDON_PRICES = {
    fence: 110000,
    fencing: 110000,
    lighting: 85000,
    geoplastics: 145000,
    maf_set: 65000
  };

  function formatMoney(amount) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' ₽';
  }

  function showToast(message) {
    var existingToast = document.querySelector('.shumger-toast');
    if (existingToast) existingToast.remove();

    var toast = document.createElement('div');
    toast.className = 'shumger-toast';
    toast.innerHTML = '<span class="toast-icon">✓</span><span>' + message + '</span>';
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('is-visible');
    }, 10);

    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }

  function setupCalculator(container) {
    if (!container || container.getAttribute('data-calc-inited')) return;
    container.setAttribute('data-calc-inited', 'true');

    var areaSlider = container.querySelector('[data-calc-area]');
    var areaDisplay = container.querySelector('[data-calc-area-val]');
    var presetBtns = container.querySelectorAll('[data-calc-area-preset]');
    var typeRadios = container.querySelectorAll('input[name="calc_type"]');
    var foundationRadios = container.querySelectorAll('input[name="calc_foundation"]');
    var foundationSelect = container.querySelector('[data-calc-foundation]');
    var qualityRadios = container.querySelectorAll('input[name="calc_quality"]');
    var qualitySelect = container.querySelector('[data-calc-quality], [data-calc-tier]');
    var addonCheckboxes = container.querySelectorAll('[data-calc-addon]');

    // Элементы вывода
    var totalEl = container.querySelector('[data-calc-total]');
    var equipEl = container.querySelector('[data-calc-equip]');
    var surfaceEl = container.querySelector('[data-calc-surface]');
    var workEl = container.querySelector('[data-calc-work]');
    var daysEl = container.querySelector('[data-calc-days]');
    var warrantyEl = container.querySelector('[data-calc-warranty]');
    var orderBtn = container.querySelector('[data-calc-order]');
    var copyBtn = container.querySelector('[data-calc-copy]');

    // Прогресс-бары пропорций сметы
    var barEquip = container.querySelector('[data-calc-bar-equip]');
    var barSurface = container.querySelector('[data-calc-bar-surface]');
    var barWork = container.querySelector('[data-calc-bar-work]');
    var barEquipPct = container.querySelector('[data-calc-bar-equip-pct]');
    var barSurfacePct = container.querySelector('[data-calc-bar-surface-pct]');
    var barWorkPct = container.querySelector('[data-calc-bar-work-pct]');

    // Применение URL-параметров (например: calculator.html?type=workout&area=240)
    var urlParams = new URLSearchParams(window.location.search);
    var paramType = urlParams.get('type');
    var paramArea = urlParams.get('area');

    if (paramType) {
      typeRadios.forEach(function (r) {
        if (r.value === paramType) {
          r.checked = true;
        }
      });
    }

    if (paramArea && areaSlider) {
      var parsedArea = parseInt(paramArea, 10);
      if (!isNaN(parsedArea) && parsedArea >= 30 && parsedArea <= 800) {
        areaSlider.value = parsedArea;
      }
    }

    function updateSliderBackground(slider) {
      if (!slider) return;
      var min = parseFloat(slider.min) || 30;
      var max = parseFloat(slider.max) || 800;
      var val = parseFloat(slider.value) || min;
      var percentage = ((val - min) / (max - min)) * 100;
      slider.style.background = 'linear-gradient(to right, var(--color-off-black-ink) 0%, var(--color-off-black-ink) ' + percentage + '%, var(--color-ash) ' + percentage + '%, var(--color-ash) 100%)';
    }

    function calculate() {
      // 1. Площадь
      var area = areaSlider ? parseInt(areaSlider.value, 10) : 180;
      if (areaDisplay) {
        areaDisplay.textContent = area;
      }
      updateSliderBackground(areaSlider);

      // Синхронизация подсветки кнопок-пресетов
      presetBtns.forEach(function (btn) {
        var presetVal = parseInt(btn.getAttribute('data-calc-area-preset'), 10);
        if (presetVal === area) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // 2. Тип объекта
      var typeKey = 'kids';
      typeRadios.forEach(function (radio) {
        if (radio.checked) {
          typeKey = radio.value;
        }
      });
      var typeData = BASE_RATES[typeKey] || BASE_RATES.kids;

      // 3. Состояние основания (из радиокнопок или select)
      var foundationKey = 'ground';
      if (foundationRadios.length > 0) {
        foundationRadios.forEach(function (r) {
          if (r.checked) foundationKey = r.value;
        });
      } else if (foundationSelect) {
        foundationKey = foundationSelect.value;
      }
      var foundationRate = Object.prototype.hasOwnProperty.call(FOUNDATION_RATES, foundationKey)
        ? FOUNDATION_RATES[foundationKey]
        : 1800;

      // 4. Комплектация оборудования (из радиокнопок или select)
      var qualityKey = 'comfort';
      if (qualityRadios.length > 0) {
        qualityRadios.forEach(function (r) {
          if (r.checked) qualityKey = r.value;
        });
      } else if (qualitySelect) {
        qualityKey = qualitySelect.value;
      }
      var tierMult = TIER_MULTIPLIERS[qualityKey] || 1.25;

      // 5. Дополнительные опции
      var addonsCost = 0;
      var selectedAddonsNames = [];
      addonCheckboxes.forEach(function (cb) {
        if (cb.checked) {
          var price = ADDON_PRICES[cb.value] || 0;
          addonsCost += price;
          var label = cb.closest('label');
          if (label) {
            var nameEl = label.querySelector('.option-name');
            selectedAddonsNames.push(nameEl ? nameEl.textContent.trim() : cb.value);
          }
        }
      });

      // Расчет компонентов сметы
      var baseObjectCost = (area * typeData.basePrice) * tierMult;
      var foundationCost = area * foundationRate;
      var totalCost = Math.round(baseObjectCost + foundationCost + addonsCost);

      var equipCost = Math.round((baseObjectCost * typeData.equipRatio) + (addonsCost * 0.7));
      var surfCost = Math.round(baseObjectCost * typeData.surfRatio);
      var workCost = Math.round((baseObjectCost * typeData.workRatio) + foundationCost + (addonsCost * 0.3));

      // Пропорции для прогресс-бара
      var equipPct = Math.round((equipCost / totalCost) * 100);
      var surfPct = Math.round((surfCost / totalCost) * 100);
      var workPct = 100 - equipPct - surfPct;

      // Сроки производства работ
      var estimatedDays = Math.max(5, Math.ceil((area / 100) * typeData.daysPer100m) + (foundationRate > 0 ? 3 : 0));

      // Обновление DOM значений
      if (totalEl) totalEl.textContent = formatMoney(totalCost);
      if (equipEl) equipEl.textContent = formatMoney(equipCost);
      if (surfaceEl) surfaceEl.textContent = formatMoney(surfCost);
      if (workEl) workEl.textContent = formatMoney(workCost);
      if (daysEl) daysEl.textContent = 'от ' + estimatedDays + ' раб. дн.';
      if (warrantyEl) warrantyEl.textContent = qualityKey === 'premium' ? '5 лет' : '3 года';

      // Обновление прогресс-бара
      if (barEquip) barEquip.style.width = equipPct + '%';
      if (barSurface) barSurface.style.width = surfPct + '%';
      if (barWork) barWork.style.width = workPct + '%';
      if (barEquipPct) barEquipPct.textContent = equipPct + '%';
      if (barSurfacePct) barSurfacePct.textContent = surfPct + '%';
      if (barWorkPct) barWorkPct.textContent = workPct + '%';

      // Описание конфигурации для заявки и буфера
      var qualityName = qualityKey === 'premium' ? 'Премиум Эко (Робиния/Inox)' : (qualityKey === 'comfort' ? 'Комфорт (HPL/Оцинковка)' : 'Стандарт (ФСФ/Порошок)');
      var foundationName = foundationRate === 0 ? 'Готовое основание' : (foundationRate === 750 ? 'Щебеночное' : 'Монолитная ж/б плита В22.5');

      var summaryString = typeData.name + ' (' + area + ' м²)\n' +
        '• Класс: ' + qualityName + '\n' +
        '• Основание: ' + foundationName + '\n' +
        (selectedAddonsNames.length ? '• Доп. работы: ' + selectedAddonsNames.join(', ') + '\n' : '') +
        '• Срок: от ' + estimatedDays + ' раб. дней | Гарантия: ' + (qualityKey === 'premium' ? '5 лет' : '3 года') + '\n' +
        '• Оборудование: ' + formatMoney(equipCost) + ' (' + equipPct + '%)\n' +
        '• Покрытие: ' + formatMoney(surfCost) + ' (' + surfPct + '%)\n' +
        '• Монтаж и основание: ' + formatMoney(workCost) + ' (' + workPct + '%)\n' +
        'ИТОГО ПОД КЛЮЧ: ' + formatMoney(totalCost) + ' (с НДС 20%)';

      if (orderBtn) {
        orderBtn.setAttribute('data-calc-summary', summaryString.replace(/\n/g, ' // '));
      }

      if (copyBtn) {
        copyBtn.setAttribute('data-calc-spec', summaryString);
      }
    }

    // Слушатели событий
    if (areaSlider) {
      areaSlider.addEventListener('input', calculate);
    }

    presetBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var val = parseInt(btn.getAttribute('data-calc-area-preset'), 10);
        if (areaSlider && !isNaN(val)) {
          areaSlider.value = val;
          calculate();
        }
      });
    });

    typeRadios.forEach(function (radio) {
      radio.addEventListener('change', calculate);
    });

    foundationRadios.forEach(function (radio) {
      radio.addEventListener('change', calculate);
    });

    if (foundationSelect) {
      foundationSelect.addEventListener('change', calculate);
    }

    qualityRadios.forEach(function (radio) {
      radio.addEventListener('change', calculate);
    });

    if (qualitySelect) {
      qualitySelect.addEventListener('change', calculate);
    }

    addonCheckboxes.forEach(function (cb) {
      cb.addEventListener('change', calculate);
    });

    // Обработка кнопки заявки
    if (orderBtn) {
      orderBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var summary = orderBtn.getAttribute('data-calc-summary') || 'Расчёт сметы калькулятора';

        // 1. Попытка открыть модальное окно через глобальный app
        if (window.ShumgerApp && typeof window.ShumgerApp.openLeadModal === 'function') {
          window.ShumgerApp.openLeadModal('Смета: ' + summary);
          return;
        }

        // 2. Резервный поиск модального окна
        var modal = document.getElementById('leadModal');
        if (modal) {
          var titleEl = modal.querySelector('.modal-lead-title');
          if (titleEl) titleEl.textContent = 'Зафиксировать смету';
          var contextInput = modal.querySelector('input[name="lead_context"]');
          if (contextInput) contextInput.value = 'Расчёт: ' + summary;
          modal.classList.add('is-open');
          document.body.classList.add('modal-open');
          return;
        }

        // 3. Резервный скролл к форме обратной связи
        var leadSection = document.querySelector('.lead-box, #contactForm, #servicesPageLeadForm');
        if (leadSection) {
          leadSection.scrollIntoView({ behavior: 'smooth' });
          var msgInput = leadSection.querySelector('textarea, input[name="lead_context"]');
          if (msgInput) {
            msgInput.value = summary;
          }
        }
      });
    }

    // Обработка кнопки копирования спецификации
    if (copyBtn) {
      copyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var spec = copyBtn.getAttribute('data-calc-spec') || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(spec).then(function () {
            showToast('Спецификация сметы скопирована в буфер обмена!');
          }).catch(function () {
            fallbackCopy(spec);
          });
        } else {
          fallbackCopy(spec);
        }
      });
    }

    function fallbackCopy(text) {
      var textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Спецификация сметы скопирована в буфер обмена!');
      } catch (err) {
        showToast('Не удалось скопировать спецификацию.');
      }
      document.body.removeChild(textArea);
    }

    // Первый расчет сразу при загрузке
    calculate();
  }

  function initAllCalculators() {
    var wrappers = document.querySelectorAll('.calculator-wrapper, #calculator, #mainCalculator, #pageCalculator');
    wrappers.forEach(function (el) {
      setupCalculator(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllCalculators);
  } else {
    initAllCalculators();
  }

  window.initShumgerCalculator = initAllCalculators;
})();
