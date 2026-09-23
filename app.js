const orders = [
  { id: 1, name: 'Кабель ВВГнг 3×2.5', code: 'EK-04256', available: '68 м', forecast: '336 м', recommended: '500 м', amount: 324000, status: 'critical', label: 'Критично', explanation: 'Запас закончится через 5 дней; учтён рост +16%, 3 дня stockout и минимальная партия 100 м.' },
  { id: 2, name: 'Автоматический выключатель C16', code: 'EK-00918', available: '24 шт', forecast: '182 шт', recommended: '180 шт', amount: 186000, status: 'warning', label: 'Внимание', explanation: 'Товара в пути на 40 шт меньше обычного. Прогноз учитывает сезонность и страховой запас.' },
  { id: 3, name: 'DIN-рейка 35 мм, 1 м', code: 'EK-01502', available: '42 шт', forecast: '126 шт', recommended: '100 шт', amount: 74000, status: 'normal', label: 'Норма', explanation: 'Регулярный спрос стабилен; количество приведено к минимальной партии поставщика.' },
  { id: 4, name: 'Контактор КМИ 25А', code: 'EK-02884', available: '8 шт', forecast: '38 шт', recommended: '50 шт', amount: 232000, status: 'unknown', label: 'Мало данных', explanation: 'История короче 90 дней. Рекомендация основана на категории и текущем покрытии.' },
  { id: 5, name: 'Коробка распределительная IP54', code: 'EK-02031', available: '116 шт', forecast: '157 шт', recommended: '150 шт', amount: 128000, status: 'normal', label: 'Норма', explanation: 'Целевое покрытие 24 дня; исключены две разовые оптовые сделки.' },
];

const state = { filter: 'all', query: '', selected: new Set([1, 2, 3, 4]) };
const badgeClass = { critical: 'critical-badge', warning: 'warning-badge', normal: 'normal-badge', unknown: 'unknown-badge' };

function formatTenge(value) {
  return `₸ ${new Intl.NumberFormat('ru-RU').format(value)}`;
}

function renderOrders() {
  const body = document.querySelector('#ordersBody');
  const visible = orders.filter(order => (state.filter === 'all' || order.status === state.filter) && `${order.name} ${order.code}`.toLowerCase().includes(state.query));
  body.innerHTML = visible.map(order => `
    <tr>
      <td><input class="order-check" type="checkbox" data-order-id="${order.id}" aria-label="Выбрать ${order.name}" ${state.selected.has(order.id) ? 'checked' : ''}></td>
      <td class="product-cell"><strong>${order.name}</strong><small>${order.code}</small></td>
      <td class="number-cell">${order.available}</td>
      <td class="number-cell">${order.forecast}</td>
      <td class="rec-cell">${order.recommended}</td>
      <td><span class="badge ${badgeClass[order.status]}">${order.label}</span></td>
      <td class="explanation-cell">${order.explanation}</td>
      <td><button class="inline-link product-link" data-view="product" aria-label="Открыть карточку ${order.name}">Разбор →</button></td>
    </tr>`).join('') || '<tr><td colspan="8" class="empty-cell">По вашему фильтру позиций не найдено.</td></tr>';
  document.querySelector('.select-all').checked = visible.length > 0 && visible.every(order => state.selected.has(order.id));
  updateOrderSummary();
}

function updateOrderSummary() {
  const chosen = orders.filter(order => state.selected.has(order.id));
  const total = chosen.reduce((sum, order) => sum + order.amount, 0);
  document.querySelector('#selectedItems').textContent = `${chosen.length} ${plural(chosen.length, 'позиция', 'позиции', 'позиций')}`;
  document.querySelector('#selectedSum').textContent = formatTenge(total);
}

function plural(value, one, few, many) {
  const ten = value % 10, hundred = value % 100;
  return ten === 1 && hundred !== 11 ? one : ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14) ? few : many;
}

function changeView(viewName) {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === viewName));
  document.querySelectorAll('.nav-item').forEach(item => {
    const active = item.dataset.view === viewName;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('#main-content').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(setToast.timer);
  setToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3500);
}

function showModal() {
  document.querySelector('#confirmModal').hidden = false;
  document.querySelector('#responsibilityCheckbox').focus();
}

function closeModal() {
  document.querySelector('#confirmModal').hidden = true;
  document.querySelector('#openConfirm').focus();
}

function updateScenario() {
  const demand = Number(document.querySelector('#demandRange').value);
  const lead = Number(document.querySelector('#leadRange').value);
  const transit = document.querySelector('#transitToggle').checked;
  const stockout = document.querySelector('#stockoutToggle').checked;
  const regular = 11.2 * (1 + demand / 100);
  const demandForLead = Math.round(regular * lead);
  const safety = Math.round(regular * 21);
  const lost = stockout ? 34 : 0;
  const available = 68 + (transit ? 120 : 0);
  const raw = demandForLead + safety + lost - available;
  const quantity = Math.max(100, Math.ceil(raw / 100) * 100);
  const delta = quantity - 500;
  document.querySelector('#demandValue').textContent = `${demand > 0 ? '+' : ''}${demand}%`;
  document.querySelector('#leadValue').textContent = `${lead} ${plural(lead, 'день', 'дня', 'дней')}`;
  document.querySelector('#scenarioQuantity').innerHTML = `${quantity} <small>м</small>`;
  document.querySelector('#scenarioDelta').textContent = delta === 0 ? 'Без изменений к базовой рекомендации' : `${delta > 0 ? 'На ' : 'На '}${Math.abs(delta)} м ${delta > 0 ? 'больше' : 'меньше'} базовой рекомендации`;
  document.querySelector('#demandCalc').textContent = `${demandForLead} м`;
  document.querySelector('#safetyCalc').textContent = `${safety} м`;
  document.querySelector('#adjustmentCalc').textContent = `${lost ? '+' + lost : '0'} м`;
  document.querySelector('#availableCalc').textContent = `−${available} м`;
  document.querySelector('#demandBar').style.width = `${Math.min(100, demandForLead / 3.2)}%`;
  document.querySelector('#safetyBar').style.width = `${Math.min(100, safety / 3.5)}%`;
  document.querySelector('#adjustmentBar').style.width = `${lost ? 40 : 6}%`;
  document.querySelector('#availableBar').style.width = `${Math.min(100, available / 3.5)}%`;
  const stateName = demand > 0 ? 'Рост спроса' : demand < 0 ? 'Снижение спроса' : lead > 10 ? 'Задержка поставки' : 'Текущий спрос';
  document.querySelector('#scenarioState').textContent = stateName;
  const insight = document.querySelector('#scenarioInsight');
  if (quantity >= 800 || lead >= 16) {
    insight.innerHTML = '<b aria-hidden="true">!</b><p><strong>Проверьте сценарий.</strong> Увеличение срока поставки или спроса заметно повышает потребность в закупке.</p>';
    insight.style.background = 'var(--amber-pale)'; insight.style.borderColor = '#fae1ae';
    insight.querySelector('b').style.background = 'var(--amber)'; insight.querySelector('p').style.color = '#765319'; insight.querySelector('strong').style.color = '#865000';
  } else {
    insight.innerHTML = '<b aria-hidden="true">✓</b><p><strong>Решение стабильно.</strong> Рекомендация укладывается в порог минимальной партии поставщика.</p>';
    insight.style.background = 'var(--green-pale)'; insight.style.borderColor = '#c5e8d8';
    insight.querySelector('b').style.background = 'var(--green)'; insight.querySelector('p').style.color = '#285948'; insight.querySelector('strong').style.color = '#096342';
  }
}

document.addEventListener('click', event => {
  const viewTrigger = event.target.closest('[data-view]');
  if (viewTrigger) changeView(viewTrigger.dataset.view);

  const filter = event.target.closest('.filter-chip');
  if (filter) {
    state.filter = filter.dataset.filter;
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('selected', chip === filter));
    renderOrders();
  }

  const preset = event.target.closest('.scenario-preset');
  if (preset) {
    document.querySelector('#demandRange').value = preset.dataset.demand;
    document.querySelector('#leadRange').value = preset.dataset.lead;
    updateScenario();
  }

  if (event.target.closest('#openConfirm') || event.target.closest('#approveAll')) showModal();
  if (event.target.closest('.modal-close') || event.target.closest('.modal-cancel')) closeModal();
  if (event.target.id === 'refreshData') setToast('Расчёт обновлён: источники данных проверены, рекомендации актуальны.');
  if (event.target.id === 'runQuality') setToast('Проверка завершена: индекс качества данных 92/100.');
  if (event.target.id === 'resetScenario') {
    document.querySelector('#demandRange').value = 0; document.querySelector('#leadRange').value = 10;
    document.querySelector('#transitToggle').checked = false; document.querySelector('#stockoutToggle').checked = true; updateScenario();
  }
  if (event.target.id === 'exportButton') exportOrders();
  if (event.target.closest('.menu-toggle')) {
    const sidebar = document.querySelector('.sidebar'); const open = sidebar.classList.toggle('open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', String(open));
  }
});

document.addEventListener('change', event => {
  if (event.target.classList.contains('order-check')) {
    const id = Number(event.target.dataset.orderId); event.target.checked ? state.selected.add(id) : state.selected.delete(id); updateOrderSummary();
  }
  if (event.target.classList.contains('select-all')) {
    const visible = orders.filter(order => (state.filter === 'all' || order.status === state.filter) && `${order.name} ${order.code}`.toLowerCase().includes(state.query));
    visible.forEach(order => event.target.checked ? state.selected.add(order.id) : state.selected.delete(order.id)); renderOrders();
  }
  if (event.target.name === 'format') {
    document.querySelectorAll('.radio-card').forEach(card => card.classList.toggle('checked', card.querySelector('input').checked));
  }
  if (event.target.id === 'responsibilityCheckbox') document.querySelector('#finalApprove').disabled = !event.target.checked;
  if (['demandRange','leadRange','transitToggle','stockoutToggle'].includes(event.target.id)) updateScenario();
});

document.querySelector('#orderSearch').addEventListener('input', event => { state.query = event.target.value.toLowerCase().trim(); renderOrders(); });
document.querySelector('#finalApprove').addEventListener('click', () => { closeModal(); setToast('Рекомендации подтверждены. Заказ не отправлен поставщику автоматически.'); });
document.querySelector('#confirmModal').addEventListener('click', event => { if (event.target.id === 'confirmModal') closeModal(); });

function exportOrders() {
  const fields = [
    ['Артикул', 'Наименование', 'Поставщик', 'Рекомендуемое количество', 'Доступно', 'Прогноз 30 дней', 'Статус', 'Обоснование'],
    ...orders.map(order => [order.code, order.name, 'ТОО «Электрокомплект»', order.recommended, order.available, order.forecast, order.label, order.explanation])
  ];
  const csv = fields.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'ALN-SupplyLens-Рекомендованный-заказ-2026-09-23.csv'; link.click(); URL.revokeObjectURL(link.href);
  setToast('CSV сформирован. Проверьте файл перед передачей в учётную систему.');
}

renderOrders();
updateScenario();
