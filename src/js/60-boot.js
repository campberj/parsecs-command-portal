if (isBrowser){
  document.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (!a) return; const fn = ACT[a.dataset.act]; if (fn){ e.preventDefault(); fn(a.dataset, a); } });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g.node')){ e.preventDefault(); ACT.sel(e.target.dataset); } });
  document.addEventListener('submit', onSubmit);
  document.addEventListener('change', onChange);
  document.addEventListener('input', e => { if (e.target.closest('#builderform') && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') onBuilderInput(e); });
  window.addEventListener('beforeunload', () => { if (S) { S.savedAt = new Date().toISOString(); lsSet('pcp-camp:' + S.id, S); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && MODAL){ MODAL = null; renderModal(); } });
  boot();
}
