document.getElementById('payForm').addEventListener('submit', async e =>{
  e.preventDefault();
  const f = e.target;
  const month = f.monthPaidFor.value.trim();
  const amount = Number(f.amountPaid.value);
  if (!month || Number.isNaN(amount) || amount <= 0) {
    document.getElementById('msg').textContent = 'Provide a valid month and amount';
    return;
  }
  const data = { monthPaidFor: month, amountPaid: amount };
  try{
    const res = await apiFetch('/payments/pay', { method: 'POST', body: data });
    document.getElementById('msg').textContent = res.message || 'Payment sent';
  } catch(err){
    document.getElementById('msg').textContent = err?.error || err?.message || 'Payment failed';
  }
});
