const table=document.getElementById('trackerTable')
const monthSelect=document.getElementById('monthSelect')
const yearSelect=document.getElementById('yearSelect')
const monthTitle=document.getElementById('monthTitle')
const cloudBtn=document.getElementById('cloudBtn')
const cloudSignOut=document.getElementById('cloudSignOut')
const cloudModal=document.getElementById('cloudModal')
const cloudBackdrop=document.getElementById('cloudBackdrop')
const cloudEmail=document.getElementById('cloudEmail')
const cloudPass=document.getElementById('cloudPass')
const cloudSignIn=document.getElementById('cloudSignIn')
const cloudSignUp=document.getElementById('cloudSignUp')
const cloudCancel=document.getElementById('cloudCancel')
const dailyList=document.getElementById('dailyList')
const todayHeading=document.getElementById('todayHeading')
const dailyMood=document.getElementById('dailyMood')
const prevDayBtn=document.getElementById('prevDayBtn')
const nextDayBtn=document.getElementById('nextDayBtn')
const todayBtn=document.getElementById('todayBtn')
const eventsList=document.getElementById('eventsList')
const monthlyGoals=document.getElementById('monthlyGoals')
const monthlyExcited=document.getElementById('monthlyExcited')
const monthlyInsights=document.getElementById('monthlyInsights')
const dreamsBtn=document.getElementById('dreamsBtn')
const dreamModal=document.getElementById('dreamModal')
const dreamBackdrop=document.getElementById('dreamBackdrop')
const dreamClose=document.getElementById('dreamClose')
const dreamText=document.getElementById('dreamText')
const dreamTitle=document.getElementById('dreamTitle')
const journalBtn=document.getElementById('journalBtn')
const journalModal=document.getElementById('journalModal')
const journalBackdrop=document.getElementById('journalBackdrop')
const journalClose=document.getElementById('journalClose')
const journalText=document.getElementById('journalText')
const journalTitle=document.getElementById('journalTitle')
const gratefulBtn=document.getElementById('gratefulBtn')
const gratefulModal=document.getElementById('gratefulModal')
const gratefulBackdrop=document.getElementById('gratefulBackdrop')
const gratefulClose=document.getElementById('gratefulClose')
const gratefulInputs=Array.from(document.querySelectorAll('.grateful-input'))
const gratefulTitle=document.getElementById('gratefulTitle')
const addHabitBtn=document.getElementById('addHabitBtn')
const habitModal=document.getElementById('habitModal')
const habitBackdrop=document.getElementById('habitBackdrop')
const habitTitle=document.getElementById('habitTitle')
const habitNameInput=document.getElementById('habitNameInput')
const habitIconInput=document.getElementById('habitIconInput')
const habitDelete=document.getElementById('habitDelete')
const habitSave=document.getElementById('habitSave')
const habitCancel=document.getElementById('habitCancel')
const contextMenu=document.getElementById('contextMenu')

const months=['January','February','March','April','May','June','July','August','September','October','November','December']
const weekdays=['sun','mon','tue','wed','thu','fri','sat']
const DAILY_LINES=6
const EVENTS_LINES=3
const MOODS=['😊','💪','👍','😢','😴','🤞','🤒']
const CLOUD_SYNC_INTERVAL_MS=30000

const today=new Date()
let currentMonth=today.getMonth()
let currentYear=today.getFullYear()
let selectedDay=null
let selectedKey=null
let contextRange=null
let contextEditable=null
let editingHabitIndex=null

let store=JSON.parse(localStorage.getItem('habit-plus-v4')||'{}')
const SUPABASE_URL='https://bkmbbtndwfaqwktzmewe.supabase.co'
const SUPABASE_ANON_KEY='sb_publishable_a6brLIQat3zDYt2U8ifbYw_EINIeiK_'
let supabaseClient=null
let cloudUser=null
let cloudSyncTimer=null
let cloudSyncInterval=null

function escapeHtml(text){
  return String(text)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
}

function textToHtml(text){
  return escapeHtml(text).replace(/\n/g,'<br>')
}

function normalizeEditableHtml(el){
  const text=el.textContent.replace(/\u00a0/g,' ').trim()
  if(!text) return ''
  return el.innerHTML
}

function setEditableHtml(el,html){
  el.innerHTML=html||''
}

function clearEditableIfEmpty(el){
  if(el.textContent.replace(/\u00a0/g,' ').trim()==='') el.innerHTML=''
}

function daysInMonth(m,y){return new Date(y,m+1,0).getDate()}
function key(){return currentYear+'-'+currentMonth}

function initSelectors(){
  months.forEach((m,i)=>{
    const o=document.createElement('option')
    o.value=i;o.text=m;monthSelect.appendChild(o)
  })
  for(let y=2024;y<=2030;y++){
    const o=document.createElement('option')
    o.value=y;o.text=y;yearSelect.appendChild(o)
  }
  monthSelect.value=currentMonth
  yearSelect.value=currentYear
}

monthSelect.onchange=()=>{currentMonth=+monthSelect.value;render()}
yearSelect.onchange=()=>{currentYear=+yearSelect.value;render()}

function addHabit(name,icon){
  if(!name) return
  store[key()]??={habits:[],events:[],daily:{}}
  store[key()].habits.push({
    name,icon,
    color:'#e6e6e6',
    goal:daysInMonth(currentMonth,currentYear),
    checks:{}
  })
  save()
}

function editHabit(i){
  openHabitModal('edit',i)
}

function toggle(h,d,mode){
  const habit=store[key()].habits[h]
  const current=habit.checks[d]
  if(mode==='yellow'){
    habit.checks[d]=current==='yellow'?false:'yellow'
  }else{
    habit.checks[d]=current===true?false:true
  }
  save()
}

function save(){
  store._updatedAt=new Date().toISOString()
  localStorage.setItem('habit-plus-v4',JSON.stringify(store))
  scheduleCloudSync()
  render()
}

function saveQuiet(){
  store._updatedAt=new Date().toISOString()
  localStorage.setItem('habit-plus-v4',JSON.stringify(store))
  scheduleCloudSync()
}


function initSupabase(){
  if(!window.supabase) return
  supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY)
  supabaseClient.auth.getSession().then(({data})=>{
    cloudUser=data.session?data.session.user:null
    updateCloudUI()
    if(cloudUser){
      loadFromCloud()
      startCloudSyncLoop()
    }
  })
  supabaseClient.auth.onAuthStateChange((_event,session)=>{
    cloudUser=session?session.user:null
    updateCloudUI()
    if(cloudUser){
      loadFromCloud()
      startCloudSyncLoop()
    }else{
      stopCloudSyncLoop()
    }
  })
}

function updateCloudUI(){
  if(cloudUser){
    cloudBtn.classList.add('on')
    cloudSignOut.hidden=false
  }else{
    cloudBtn.classList.remove('on')
    cloudSignOut.hidden=true
  }
}

function openCloudModal(){
  cloudModal.classList.add('show')
  cloudModal.setAttribute('aria-hidden','false')
}

function closeCloudModal(){
  cloudModal.classList.remove('show')
  cloudModal.setAttribute('aria-hidden','true')
}

function scheduleCloudSync(){
  if(!supabaseClient||!cloudUser) return
  clearTimeout(cloudSyncTimer)
  cloudSyncTimer=setTimeout(pushToCloud,800)
}

function startCloudSyncLoop(){
  if(cloudSyncInterval) return
  cloudSyncInterval=setInterval(()=>{
    if(!supabaseClient||!cloudUser) return
    pushToCloud()
  },CLOUD_SYNC_INTERVAL_MS)
}

function stopCloudSyncLoop(){
  if(!cloudSyncInterval) return
  clearInterval(cloudSyncInterval)
  cloudSyncInterval=null
}

async function pushToCloud(){
  if(!supabaseClient||!cloudUser) return
  const payload={...store}
  const now=new Date().toISOString()
  payload._updatedAt=now
  await supabaseClient.from('habit_data')
    .upsert({user_id:cloudUser.id,data:payload,updated_at:now})
}

function getUpdatedAt(obj){
  if(!obj) return 0
  const ts=obj._updatedAt||obj.updated_at
  return ts?Date.parse(ts):0
}

async function loadFromCloud(){
  if(!supabaseClient||!cloudUser) return
  const {data,error}=await supabaseClient
    .from('habit_data')
    .select('data,updated_at')
    .eq('user_id',cloudUser.id)
    .single()
  if(error&&error.code!=='PGRST116') return
  if(!data||!data.data){
    scheduleCloudSync()
    return
  }
  const cloudData=data.data
  const localUpdated=getUpdatedAt(store)
  const cloudUpdated=getUpdatedAt(cloudData)||Date.parse(data.updated_at)
  if(cloudUpdated>=localUpdated){
    store=cloudData
    localStorage.setItem('habit-plus-v4',JSON.stringify(store))
    render()
  }else{
    scheduleCloudSync()
  }
}

function getDaily(day){
  store[key()].daily??={}
  const dayKey=String(day)
  if(!store[key()].daily[dayKey]){
    store[key()].daily[dayKey]={
      items:Array.from({length:DAILY_LINES},()=>({text:'',done:false})),
      mood:[],
      dream:'',
      journal:'',
      grateful:Array.from({length:5},()=> '')
    }
  }
  const items=store[key()].daily[dayKey].items
  while(items.length<DAILY_LINES){
    items.push({text:'',done:false})
  }
  if(!store[key()].daily[dayKey]._rich){
    store[key()].daily[dayKey].dream=textToHtml(store[key()].daily[dayKey].dream||'')
    store[key()].daily[dayKey].journal=textToHtml(store[key()].daily[dayKey].journal||'')
    store[key()].daily[dayKey].grateful=(store[key()].daily[dayKey].grateful||[]).map(item=>(
      textToHtml(item||'')
    ))
    items.forEach(item=>{
      if(!item._rich){
        item.text=textToHtml(item.text||'')
        item._rich=true
      }
    })
    store[key()].daily[dayKey]._rich=true
  }
  if(!Array.isArray(store[key()].daily[dayKey].mood)){
    store[key()].daily[dayKey].mood=store[key()].daily[dayKey].mood?[store[key()].daily[dayKey].mood]:[]
  }
  if(typeof store[key()].daily[dayKey].dream!=='string'){
    store[key()].daily[dayKey].dream=''
  }
  if(typeof store[key()].daily[dayKey].journal!=='string'){
    store[key()].daily[dayKey].journal=''
  }
  if(!Array.isArray(store[key()].daily[dayKey].grateful)){
    store[key()].daily[dayKey].grateful=[]
  }
  while(store[key()].daily[dayKey].grateful.length<5){
    store[key()].daily[dayKey].grateful.push('')
  }
  store[key()].daily[dayKey].grateful=store[key()].daily[dayKey].grateful.slice(0,5)
  if(store[key()].daily[dayKey].grateful.some(item=>typeof item!=='string')){
    store[key()].daily[dayKey].grateful=store[key()].daily[dayKey].grateful.map(item=>(
      typeof item==='string'?item:''
    ))
  }
  return store[key()].daily[dayKey]
}

function openDreamModal(){
  if(selectedDay===null) return
  const daily=getDaily(selectedDay)
  dreamTitle.textContent=`Dreams • ${formatDayLabel(selectedDay)}`
  setEditableHtml(dreamText,daily.dream||'')
  dreamModal.classList.add('show')
  dreamModal.setAttribute('aria-hidden','false')
  dreamText.focus()
}

function closeDreamModal(){
  dreamModal.classList.remove('show')
  dreamModal.setAttribute('aria-hidden','true')
}

function openHabitModal(mode='add',index=null){
  habitModal.classList.add('show')
  habitModal.setAttribute('aria-hidden','false')
  if(mode==='edit'){
    editingHabitIndex=index
    const h=store[key()].habits[index]
    habitTitle.textContent='Edit Habit'
    habitSave.textContent='Save'
    habitDelete.style.display='inline-flex'
    habitNameInput.value=h?.name||''
    habitIconInput.value=h?.icon||''
  }else{
    editingHabitIndex=null
    habitTitle.textContent='Add Habit'
    habitSave.textContent='Add'
    habitDelete.style.display='none'
    habitNameInput.value=''
    habitIconInput.value=''
  }
  habitNameInput.focus()
}

function closeHabitModal(){
  habitModal.classList.remove('show')
  habitModal.setAttribute('aria-hidden','true')
  editingHabitIndex=null
}

function openJournalModal(){
  if(selectedDay===null) return
  const daily=getDaily(selectedDay)
  journalTitle.textContent=`Journal • ${formatDayLabel(selectedDay)}`
  setEditableHtml(journalText,daily.journal||'')
  journalModal.classList.add('show')
  journalModal.setAttribute('aria-hidden','false')
  journalText.focus()
}

function closeJournalModal(){
  journalModal.classList.remove('show')
  journalModal.setAttribute('aria-hidden','true')
}

function openGratefulModal(){
  if(selectedDay===null) return
  const daily=getDaily(selectedDay)
  gratefulTitle.textContent=`Grateful • ${formatDayLabel(selectedDay)}`
  gratefulInputs.forEach((input,i)=>{
    setEditableHtml(input,daily.grateful?.[i]||'')
  })
  gratefulModal.classList.add('show')
  gratefulModal.setAttribute('aria-hidden','false')
  if(gratefulInputs[0]) gratefulInputs[0].focus()
}

function closeGratefulModal(){
  gratefulModal.classList.remove('show')
  gratefulModal.setAttribute('aria-hidden','true')
}

function renderDailyList(day,container){
  const daily=getDaily(day)
  container.innerHTML=''
  daily.items.slice(0,DAILY_LINES).forEach((item,i)=>{
    const line=document.createElement('div')
    line.className='todo-line'
    const check=document.createElement('button')
    check.type='button'
    check.className='todo-check'+(item.done?' checked':'')
    check.addEventListener('click',()=>{
      item.done=!item.done
      check.classList.toggle('checked',item.done)
      saveQuiet()
    })
    const input=document.createElement('div')
    input.className='todo-input'
    input.setAttribute('contenteditable','true')
    input.dataset.placeholder='Write a task...'
    setEditableHtml(input,item.text)
    input.addEventListener('input',e=>{
      item.text=normalizeEditableHtml(e.target)
      item._rich=true
      saveQuiet()
    })
    input.addEventListener('blur',e=>clearEditableIfEmpty(e.target))
    line.appendChild(check)
    line.appendChild(input)
    container.appendChild(line)
  })
}

function renderMood(day,container){
  const daily=getDaily(day)
  container.innerHTML=''
  MOODS.forEach(emoji=>{
    const btn=document.createElement('button')
    btn.type='button'
    const isSelected=daily.mood.includes(emoji)
    btn.className='mood-btn'+(isSelected?' selected':'')
    btn.textContent=emoji
    btn.addEventListener('click',()=>{
      if(daily.mood.includes(emoji)){
        daily.mood=daily.mood.filter(e=>e!==emoji)
      }else{
        daily.mood=[...daily.mood,emoji]
      }
      saveQuiet()
      renderMood(day,container)
    })
    container.appendChild(btn)
  })
}

function getEvents(day){
  store[key()].events??={}
  if(Array.isArray(store[key()].events)){
    const legacy=store[key()].events
    store[key()].events={}
    store[key()].events[String(day)]={items:legacy}
  }
  const dayKey=String(day)
  if(!store[key()].events[dayKey]){
    store[key()].events[dayKey]={items:Array.from({length:EVENTS_LINES},()=>({text:'',done:false}))}
  }
  const items=store[key()].events[dayKey].items
  while(items.length<EVENTS_LINES){
    items.push({text:'',done:false})
  }
  if(!store[key()].events[dayKey]._rich){
    items.forEach(item=>{
      if(!item._rich){
        item.text=textToHtml(item.text||'')
        item._rich=true
      }
    })
    store[key()].events[dayKey]._rich=true
  }
  return store[key()].events[dayKey]
}

function renderEventsList(day,container){
  const events=getEvents(day)
  container.innerHTML=''
  events.items.slice(0,EVENTS_LINES).forEach(item=>{
    const line=document.createElement('div')
    line.className='todo-line'
    const check=document.createElement('button')
    check.type='button'
    check.className='todo-check'+(item.done?' checked':'')
    check.addEventListener('click',()=>{
      item.done=!item.done
      check.classList.toggle('checked',item.done)
      saveQuiet()
    })
    const input=document.createElement('div')
    input.className='todo-input'
    input.setAttribute('contenteditable','true')
    input.dataset.placeholder='Event...'
    setEditableHtml(input,item.text)
    input.addEventListener('input',e=>{
      item.text=normalizeEditableHtml(e.target)
      item._rich=true
      saveQuiet()
    })
    input.addEventListener('blur',e=>clearEditableIfEmpty(e.target))
    line.appendChild(check)
    line.appendChild(input)
    container.appendChild(line)
  })
}

function setSelectedDay(day,days){
  const maxDays=days||daysInMonth(currentMonth,currentYear)
  if(day<1) day=1
  if(day>maxDays) day=maxDays
  selectedDay=day
  todayHeading.textContent=formatDayLabel(selectedDay)
  renderDailyList(selectedDay,dailyList)
  renderMood(selectedDay,dailyMood)
  renderEventsList(selectedDay,eventsList)
}

function formatDayLabel(day){
  const date=new Date(currentYear,currentMonth,day)
  const weekday=date.toLocaleDateString('en-US',{weekday:'long'})
  const suffix=getOrdinalSuffix(day)
  return `${weekday}, ${day}${suffix}`
}

function getOrdinalSuffix(n){
  const mod100=n%100
  if(mod100>=11&&mod100<=13) return 'th'
  switch(n%10){
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

function render(){
  const days=daysInMonth(currentMonth,currentYear)
  monthTitle.innerText=months[currentMonth].toUpperCase()

  store[key()]??={habits:[],events:{},daily:{},monthly:{}}
  store[key()].daily??={}
  store[key()].events??={}
  store[key()].monthly??={goals:'',excited:'',insights:''}
  if(store[key()].monthly.grateful&&!store[key()].monthly.insights){
    store[key()].monthly.insights=store[key()].monthly.grateful
  }
  if(!store[key()].monthly._rich){
    store[key()].monthly.goals=textToHtml(store[key()].monthly.goals||'')
    store[key()].monthly.excited=textToHtml(store[key()].monthly.excited||'')
    store[key()].monthly.insights=textToHtml(store[key()].monthly.insights||'')
    store[key()].monthly._rich=true
    saveQuiet()
  }
  let colorChanged=false
  store[key()].habits.forEach(h=>{
    if(h.color!=='#e6e6e6'){
      h.color='#e6e6e6'
      colorChanged=true
    }
  })
  if(colorChanged) saveQuiet()
  setEditableHtml(monthlyGoals,store[key()].monthly.goals)
  setEditableHtml(monthlyExcited,store[key()].monthly.excited)
  setEditableHtml(monthlyInsights,store[key()].monthly.insights)
  monthlyGoals.oninput=e=>{
    store[key()].monthly.goals=normalizeEditableHtml(e.target)
    store[key()].monthly._rich=true
    saveQuiet()
  }
  monthlyExcited.oninput=e=>{
    store[key()].monthly.excited=normalizeEditableHtml(e.target)
    store[key()].monthly._rich=true
    saveQuiet()
  }
  monthlyInsights.oninput=e=>{
    store[key()].monthly.insights=normalizeEditableHtml(e.target)
    store[key()].monthly._rich=true
    saveQuiet()
  }
  monthlyGoals.onblur=e=>clearEditableIfEmpty(e.target)
  monthlyExcited.onblur=e=>clearEditableIfEmpty(e.target)
  monthlyInsights.onblur=e=>clearEditableIfEmpty(e.target)

  const activeKey=key()
  if(selectedKey!==activeKey){
    selectedKey=activeKey
    selectedDay=(currentYear===today.getFullYear()&&currentMonth===today.getMonth())?today.getDate():1
  }
  if(selectedDay>days) selectedDay=days
  setSelectedDay(selectedDay,days)

  table.innerHTML=''

  const h1=document.createElement('tr')
  h1.innerHTML='<th class="habit-col">Habit</th>'+
    Array.from({length:days},(_,i)=>{
      const wd=weekdays[(i+new Date(currentYear,currentMonth,1).getDay())%7]
      return `<th class="weekday ${wd}">${wd[0].toUpperCase()}</th>`
    }).join('')+
    '<th class="icon-col">Icon</th><th>TOTAL</th><th>GOAL</th><th>%</th>'
  table.appendChild(h1)

  const h2=document.createElement('tr')
  const dailyData=store[key()].daily||{}
  const isPastDay=(day)=>{
    const viewDate=new Date(currentYear,currentMonth,day)
    const todayDate=new Date(today.getFullYear(),today.getMonth(),today.getDate())
    return viewDate<todayDate
  }
  const isToday=(day)=>(
    currentYear===today.getFullYear()&&
    currentMonth===today.getMonth()&&
    day===today.getDate()
  )
  const hasText=(value)=>typeof value==='string'&&value.trim().length>0
  h2.innerHTML='<th class="habit-col"></th>'+
    Array.from({length:days},(_,i)=>{
      const day=i+1
      const daily=dailyData[String(day)]
      const hasDream=hasText(daily?.dream)
  const hasJournal=hasText(daily?.journal)
  const hasGrateful=Array.isArray(daily?.grateful)&&daily.grateful.some(item=>hasText(item))
  const marks=[
    isPastDay(day)&&hasDream?'dream-mark':'',
    isPastDay(day)&&hasJournal?'journal-mark':'',
    hasGrateful?'grateful-mark':''
  ].filter(Boolean).join(' ')
      const todayClass=isToday(day)?'today-mark':''
      return `<th class="day-cell ${marks} ${todayClass}" data-day="${day}">${day}</th>`
    }).join('')+
    '<th class="icon-col"></th><th></th><th></th><th></th>'
  table.appendChild(h2)

  table.querySelectorAll('.day-cell').forEach(cell=>{
    cell.addEventListener('click',()=>{
      setSelectedDay(Number(cell.dataset.day),days)
      table.querySelectorAll('.day-cell').forEach(c=>c.classList.remove('selected'))
      cell.classList.add('selected')
    })
  })
  const selectedCell=table.querySelector(`.day-cell[data-day="${selectedDay}"]`)
  if(selectedCell) selectedCell.classList.add('selected')

  store[key()].habits.forEach((h,hi)=>{
    const tr=document.createElement('tr')
    tr.draggable=true
    tr.ondragstart=e=>e.dataTransfer.setData('i',hi)
    tr.ondragover=e=>e.preventDefault()
    tr.ondrop=e=>{
      const from=e.dataTransfer.getData('i')
      const arr=store[key()].habits
      arr.splice(hi,0,arr.splice(from,1)[0])
      save()
    }

    let total=0
    const nameTd=document.createElement('td')
    nameTd.className='habit-col'
    nameTd.style.background=h.color
    nameTd.innerHTML=`<div class="habit-wrap"><span class="habit-name">${h.name}</span><span class="edit" onclick="editHabit(${hi})">✏️</span></div>`
    tr.appendChild(nameTd)

    for(let d=1;d<=days;d++){
      const td=document.createElement('td')
      const box=document.createElement('div')
      const state=h.checks[d]
      box.className='checkbox'+(state===true?' checked':'')+(state==='yellow'?' checked-yellow':'')
      if(h.checks[d]) total++
      box.addEventListener('click',e=>{
        const yellow=e.metaKey||e.ctrlKey
        toggle(hi,d,yellow?'yellow':'full')
      })
      td.appendChild(box)
      tr.appendChild(td)
    }

    const iconTd=document.createElement('td')
    iconTd.className='icon-col'
    iconTd.style.background=h.color
    iconTd.innerText=h.icon||''
    tr.appendChild(iconTd)

    const daysPassed=(currentYear===today.getFullYear()&&currentMonth===today.getMonth())?today.getDate():days
    const progressRatio=days?daysPassed/days:0
    const expectedPct=Math.round(progressRatio*100)
    const pct=Math.round((total/h.goal)*100)||0
    const pctDelta=pct-expectedPct
    const totalTd=document.createElement('td')
    totalTd.innerText=total
    tr.appendChild(totalTd)

    const goalTd=document.createElement('td')
    const goalInput=document.createElement('input')
    goalInput.className='goal-input'
    goalInput.type='number'
    goalInput.value=h.goal
    goalInput.addEventListener('change',e=>{
      store[key()].habits[hi].goal=+e.target.value
      save()
    })
    goalTd.appendChild(goalInput)
    tr.appendChild(goalTd)

    const pctTd=document.createElement('td')
    pctTd.innerText=`${pct}%`
    if(pctDelta<-35){
      pctTd.className='pct-bad'
    }else if(pctDelta<0){
      pctTd.className='pct-warn'
    }else{
      pctTd.className='pct-good'
    }
    tr.appendChild(pctTd)

    table.appendChild(tr)
  })
}

cloudBtn.addEventListener('click',openCloudModal)
cloudBackdrop.addEventListener('click',closeCloudModal)
cloudCancel.addEventListener('click',closeCloudModal)
cloudSignOut.addEventListener('click',async()=>{
  if(!supabaseClient) return
  await supabaseClient.auth.signOut()
  closeCloudModal()
})
cloudSignIn.addEventListener('click',async()=>{
  if(!supabaseClient) return
  const email=cloudEmail.value.trim()
  const password=cloudPass.value
  if(!email||!password) return
  const {error}=await supabaseClient.auth.signInWithPassword({email,password})
  if(error) alert(error.message)
  else closeCloudModal()
})
cloudSignUp.addEventListener('click',async()=>{
  if(!supabaseClient) return
  const email=cloudEmail.value.trim()
  const password=cloudPass.value
  if(!email||!password) return
  const {error}=await supabaseClient.auth.signUp({email,password})
  if(error) alert(error.message)
  else closeCloudModal()
})
dreamsBtn.addEventListener('click',openDreamModal)
dreamBackdrop.addEventListener('click',closeDreamModal)
dreamClose.addEventListener('click',closeDreamModal)
dreamText.addEventListener('input',e=>{
  if(selectedDay===null) return
  const daily=getDaily(selectedDay)
  daily.dream=normalizeEditableHtml(e.target)
  daily._rich=true
  saveQuiet()
})
dreamText.addEventListener('blur',e=>clearEditableIfEmpty(e.target))
journalBtn.addEventListener('click',openJournalModal)
journalBackdrop.addEventListener('click',closeJournalModal)
journalClose.addEventListener('click',closeJournalModal)
journalText.addEventListener('input',e=>{
  if(selectedDay===null) return
  const daily=getDaily(selectedDay)
  daily.journal=normalizeEditableHtml(e.target)
  daily._rich=true
  saveQuiet()
})
journalText.addEventListener('blur',e=>clearEditableIfEmpty(e.target))
gratefulBtn.addEventListener('click',openGratefulModal)
gratefulBackdrop.addEventListener('click',closeGratefulModal)
gratefulClose.addEventListener('click',closeGratefulModal)
gratefulInputs.forEach((input,i)=>{
  input.addEventListener('input',e=>{
    if(selectedDay===null) return
    const daily=getDaily(selectedDay)
    daily.grateful[i]=normalizeEditableHtml(e.target)
    daily._rich=true
    saveQuiet()
  })
  input.addEventListener('blur',e=>clearEditableIfEmpty(e.target))
})
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&cloudModal.classList.contains('show')){
    closeCloudModal()
  }
  if(e.key==='Escape'&&dreamModal.classList.contains('show')){
    closeDreamModal()
  }
  if(e.key==='Escape'&&habitModal.classList.contains('show')){
    closeHabitModal()
  }
  if(e.key==='Escape'&&journalModal.classList.contains('show')){
    closeJournalModal()
  }
  if(e.key==='Escape'&&gratefulModal.classList.contains('show')){
    closeGratefulModal()
  }
})

addHabitBtn.addEventListener('click',()=>openHabitModal('add'))
habitBackdrop.addEventListener('click',closeHabitModal)
habitCancel.addEventListener('click',closeHabitModal)
habitDelete.addEventListener('click',()=>{
  if(editingHabitIndex===null) return
  const h=store[key()].habits[editingHabitIndex]
  const name=h?.name||'this habit'
  if(!confirm(`Delete habit "${name}"?`)) return
  store[key()].habits.splice(editingHabitIndex,1)
  save()
  closeHabitModal()
})
habitSave.addEventListener('click',()=>{
  const name=habitNameInput.value.trim()
  const icon=habitIconInput.value.trim()
  if(!name) return
  if(editingHabitIndex===null){
    addHabit(name,icon)
  }else{
    const h=store[key()].habits[editingHabitIndex]
    if(h){
      h.name=name
      h.icon=icon
    }
    save()
  }
  closeHabitModal()
})

function closeContextMenu(){
  contextMenu.classList.remove('show')
  contextMenu.setAttribute('aria-hidden','true')
  contextRange=null
  contextEditable=null
}

function openContextMenu(x,y,range,editable){
  contextRange=range
  contextEditable=editable
  contextMenu.classList.add('show')
  contextMenu.setAttribute('aria-hidden','false')
  contextMenu.style.left=`${x}px`
  contextMenu.style.top=`${y}px`
  const rect=contextMenu.getBoundingClientRect()
  const pad=8
  let nx=x
  let ny=y
  if(rect.right>window.innerWidth-pad){
    nx=window.innerWidth-rect.width-pad
  }
  if(rect.bottom>window.innerHeight-pad){
    ny=window.innerHeight-rect.height-pad
  }
  contextMenu.style.left=`${Math.max(pad,nx)}px`
  contextMenu.style.top=`${Math.max(pad,ny)}px`
}

function restoreContextSelection(){
  if(!contextEditable) return false
  contextEditable.focus()
  if(!contextRange) return true
  const selection=window.getSelection()
  selection.removeAllRanges()
  selection.addRange(contextRange)
  return true
}

function insertEmoji(emoji){
  if(!emoji) return
  const selection=window.getSelection()
  const makeSpacer=(needsSpace)=>needsSpace?' ':''
  if(selection.rangeCount){
    const range=selection.getRangeAt(0)
    range.deleteContents()
    const beforeChar=(()=>{
      const node=range.startContainer
      if(node.nodeType===Node.TEXT_NODE){
        return node.textContent?.[range.startOffset-1]||''
      }
      return ''
    })()
    const afterChar=(()=>{
      const node=range.startContainer
      if(node.nodeType===Node.TEXT_NODE){
        return node.textContent?.[range.startOffset]||''
      }
      return ''
    })()
    const needsLead=beforeChar&&!/\s/.test(beforeChar)
    const needsTrail=afterChar&&!/\s/.test(afterChar)
    const text=makeSpacer(needsLead)+emoji+makeSpacer(needsTrail)
    range.insertNode(document.createTextNode(text))
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }else if(contextEditable){
    const text=emoji+' '
    contextEditable.appendChild(document.createTextNode(text))
  }
  contextEditable?.dispatchEvent(new Event('input',{bubbles:true}))
}

contextMenu.addEventListener('click',e=>{
  const button=e.target.closest('button')
  if(!button) return
  if(!restoreContextSelection()) return
  const cmd=button.dataset.cmd
  const color=button.dataset.color
  const emoji=button.dataset.emoji
  if(cmd){
    document.execCommand(cmd,false,null)
  }
  if(color){
    document.execCommand('foreColor',false,color)
  }
  if(emoji){
    insertEmoji(emoji)
  }
  closeContextMenu()
})

document.addEventListener('contextmenu',e=>{
  const editable=e.target.closest('[contenteditable="true"]')
  if(!editable){
    closeContextMenu()
    return
  }
  e.preventDefault()
  const selection=window.getSelection()
  let range=null
  if(selection.rangeCount){
    const candidate=selection.getRangeAt(0)
    if(editable.contains(candidate.startContainer)){
      range=candidate
    }
  }
  openContextMenu(e.clientX,e.clientY,range,editable)
})
contextMenu.addEventListener('contextmenu',e=>e.preventDefault())
document.addEventListener('click',e=>{
  if(contextMenu.classList.contains('show')&&!contextMenu.contains(e.target)){
    closeContextMenu()
  }
})
window.addEventListener('blur',closeContextMenu)
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&contextMenu.classList.contains('show')){
    closeContextMenu()
  }
})

initSelectors()
initSupabase()
render()

window.addEventListener('beforeunload',()=>{
  if(!supabaseClient||!cloudUser) return
  pushToCloud()
})

prevDayBtn.addEventListener('click',()=>{
  selectedDay-=1
  render()
})
nextDayBtn.addEventListener('click',()=>{
  selectedDay+=1
  render()
})
todayBtn.addEventListener('click',()=>{
  currentMonth=today.getMonth()
  currentYear=today.getFullYear()
  monthSelect.value=currentMonth
  yearSelect.value=currentYear
  selectedDay=today.getDate()
  render()
})
