
   https://kgsczbchtgtncfaaxpdt.supabase.co
   sb_publishable_tfAGMsIfL9A7WxmA7SELaQ_BHcmN2bc
);

function calculatePrice(cat, days) {
  const table = {
    Knatte:[140,220,290,340,380,420,420],
    Junior:[200,290,360,430,500,530,530],
    Vuxen:[280,380,470,550,610,680,680]
  };

  const extra = {Knatte:60, Junior:70, Vuxen:90};

  if(days <= 7) return table[cat][days-1];
  return table[cat][6] + (days-7) * extra[cat];
}

async function loadInventory(){
  let { data } = await supabase.from('inventory').select('*');
  let select = document.getElementById("length");
  select.innerHTML = "";

  data
    .filter(i => i.available > 0)
    .sort((a,b)=>a.length-b.length)
    .forEach(i=>{
      let opt = document.createElement("option");
      opt.value = i.length;
      opt.text = i.length + " cm (" + i.available + " kvar)";
      select.appendChild(opt);
    });
}

async function rent(){
  let customer = document.getElementById("customer").value;
  let category = document.getElementById("category").value;
  let length = parseInt(document.getElementById("length").value);
  let days = parseInt(document.getElementById("days").value);

  if(!customer || !days) return alert("Fyll i alla fält");

  let price = calculatePrice(category, days);

  await supabase.from('rentals').insert({
    customer, category, length, days, price
  });

  await supabase.rpc('decrease_stock', { len: length });

  document.getElementById("customer").value = "";
  document.getElementById("days").value = "";

  loadInventory();
  loadRentals();
}

async function loadRentals(){
  let { data } = await supabase
    .from('rentals')
    .select('*')
    .eq('returned', false);

  let div = document.getElementById("rentals");
  div.innerHTML = "";

  data.forEach(r=>{
    div.innerHTML += `
      <div class="card">
        ${r.customer} – ${r.length}cm – ${r.days} dagar – ${r.price} kr
        <button onclick="returnItem(${r.id},${r.length})">Återlämna</button>
      </div>
    `;
  });
}

async function returnItem(id,length){
  await supabase.from('rentals')
    .update({returned:true})
    .eq('id',id);

  await supabase.rpc('increase_stock', { len: length });

  loadInventory();
  loadRentals();
}

loadInventory();
loadRentals();
