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

const months=['January','February','March','April','May','June','July','August','September','October','November','December']
const weekdays=['sun','mon','tue','wed','thu','fri','sat']
const DAILY_LINES=6
const EVENTS_LINES=3
const MOODS=['😊','💪','👍','😢','😴','🤞','🤒']

const today=new Date()
let currentMonth=today.getMonth()
let currentYear=today.getFullYear()
let selectedDay=null
let selectedKey=null

let store=JSON.parse(localStorage.getItem('habit-plus-v4')||'{}')
const SUPABASE_URL='https://bkmbbtndwfaqwktzmewe.supabase.co'
const SUPABASE_ANON_KEY='sb_publishable_a6brLIQat3zDYt2U8ifbYw_EINIeiK_'
let supabaseClient=null
let cloudUser=null
let cloudSyncTimer=null

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

function addHabit(){
  const name=prompt('Habit name')
  if(!name) return
  const icon=prompt('Emoji icon','')||''
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
  const h=store[key()].habits[i]
  const name=prompt('Edit habit name',h.name)
  if(name!==null) h.name=name
  const icon=prompt('Edit emoji',h.icon)
  if(icon!==null) h.icon=icon
  save()
}

function toggle(h,d){
  const habit=store[key()].habits[h]
  habit.checks[d]=!habit.checks[d]
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
    if(cloudUser) loadFromCloud()
  })
  supabaseClient.auth.onAuthStateChange((_event,session)=>{
    cloudUser=session?session.user:null
    updateCloudUI()
    if(cloudUser) loadFromCloud()
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
  if(error||!data||!data.data) return
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
    store[key()].daily[dayKey]={items:Array.from({length:DAILY_LINES},()=>({text:'',done:false})),mood:[]}
  }
  const items=store[key()].daily[dayKey].items
  while(items.length<DAILY_LINES){
    items.push({text:'',done:false})
  }
  if(!Array.isArray(store[key()].daily[dayKey].mood)){
    store[key()].daily[dayKey].mood=store[key()].daily[dayKey].mood?[store[key()].daily[dayKey].mood]:[]
  }
  return store[key()].daily[dayKey]
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
    const input=document.createElement('input')
    input.className='todo-input'
    input.type='text'
    input.placeholder='Write a task...'
    input.value=item.text
    input.addEventListener('input',e=>{
      item.text=e.target.value
      saveQuiet()
    })
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
    const input=document.createElement('input')
    input.className='todo-input'
    input.type='text'
    input.placeholder='Event...'
    input.value=item.text
    input.addEventListener('input',e=>{
      item.text=e.target.value
      saveQuiet()
    })
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
  let colorChanged=false
  store[key()].habits.forEach(h=>{
    if(h.color!=='#e6e6e6'){
      h.color='#e6e6e6'
      colorChanged=true
    }
  })
  if(colorChanged) saveQuiet()
  monthlyGoals.value=store[key()].monthly.goals
  monthlyExcited.value=store[key()].monthly.excited
  monthlyInsights.value=store[key()].monthly.insights
  monthlyGoals.oninput=e=>{store[key()].monthly.goals=e.target.value;save()}
  monthlyExcited.oninput=e=>{store[key()].monthly.excited=e.target.value;save()}
  monthlyInsights.oninput=e=>{store[key()].monthly.insights=e.target.value;save()}

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
  h2.innerHTML='<th class="habit-col"></th>'+
    Array.from({length:days},(_,i)=>`<th class="day-cell" data-day="${i+1}">${i+1}</th>`).join('')+
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
      box.className='checkbox'+(h.checks[d]?' checked':'')
      if(h.checks[d]) total++
      box.addEventListener('click',()=>toggle(hi,d))
      td.appendChild(box)
      tr.appendChild(td)
    }

    const iconTd=document.createElement('td')
    iconTd.className='icon-col'
    iconTd.style.background=h.color
    iconTd.innerText=h.icon||''
    tr.appendChild(iconTd)

    const pct=Math.round((total/h.goal)*100)||0
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
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&cloudModal.classList.contains('show')){
    closeCloudModal()
  }
})

initSelectors()
initSupabase()
render()

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
