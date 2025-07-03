let editingRoutineIndex = null;
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.getElementById(id).classList.add('visible');
  if (id === 'new') {
    document.getElementById('currentDate').innerText = new Date().toLocaleString();
  }
  if (id === 'history') loadHistory();
  if (id === 'routines') loadSavedRoutines();
}

function setRoutineDay(index) {
  const routines = JSON.parse(localStorage.getItem('routines') || '[]');
  const routine = routines[index];
  if (!routine) return;
  showSection('new');
  const history = JSON.parse(localStorage.getItem('history') || '[]').reverse();
  const lastMatch = history.find(h => h.exercises.some(e => routine.exercises.includes(e.name)));
  document.getElementById('exerciseList').innerHTML = '';
  routine.exercises.forEach(exName => {
    addExercise(exName);
    const block = document.getElementById('exerciseList').lastElementChild;
    if (lastMatch) {
      const found = lastMatch.exercises.find(e => e.name === exName);
      if (found) {
        found.series.forEach(s => {
          const btn = block.querySelector('button');
          addSerie(btn);
          const serie = block.querySelector('.seriesList').lastElementChild;
          serie.querySelector('.reps').value = s.reps;
          serie.querySelector('.weight').value = s.weight;
        });
      }
    }
  });
}

function addExercise(name = '') {
  const id = 'note_' + Math.random().toString(36).substring(2, 9);
  const div = document.createElement('div');
  div.className = 'exercise-block';
  div.innerHTML = `
    <input type="text" placeholder="Nombre del ejercicio" class="exerciseName" value="${name}" oninput="showLastInfo(this, '${id}')">
    <div class="note" id="${id}"></div>
    <div class="seriesList"></div>
    <button onclick="addSerie(this)">➕ Añadir Serie</button>
    <button onclick="this.parentElement.remove()" style="background-color:#e74c3c;margin-top:0.5rem;">❌ Eliminar Ejercicio</button>
  `;
  document.getElementById('exerciseList').appendChild(div);
  if (name) showLastInfo(div.querySelector('.exerciseName'), id);
}

function addSerie(btn) {
  const div = document.createElement('div');
  div.className = 'series-entry';
  div.innerHTML = `
    <input type="number" placeholder="Reps" class="reps" />
    <input type="number" placeholder="Peso (kg)" class="weight" />
  `;
  btn.previousElementSibling.appendChild(div);
}

function showLastInfo(input, targetId) {
  const name = input.value.trim().toLowerCase();
  const history = JSON.parse(localStorage.getItem('history') || '[]').reverse();
  const div = document.getElementById(targetId);
  for (const w of history) {
    const match = w.exercises.find(e => e.name.trim().toLowerCase() === name);
    if (match) {
      const reps = match.series.map(s => `${s.reps}x${s.weight}kg`).join(', ');
      let improvementNote = '';
      const block = input.closest('.exercise-block');
      if (block) {
        const currReps = block.querySelectorAll('.reps');
        const currWeight = block.querySelectorAll('.weight');
        if (currReps.length && currWeight.length) {
          const last = match.series[match.series.length - 1];
          const current = {
            reps: parseInt(currReps[currReps.length - 1].value) || 0,
            weight: parseFloat(currWeight[currWeight.length - 1].value) || 0
          };
          const lastWeight = parseFloat(last.weight);
          const lastReps = parseInt(last.reps);
          if (!isNaN(current.weight) && current.weight > lastWeight) {
            improvementNote = `📈 +${current.weight - lastWeight}kg respecto a la última vez`;
          } else if (!isNaN(current.reps) && current.reps > lastReps) {
            improvementNote = `📈 +${current.reps - lastReps} reps respecto a la última vez`;
          }
        }
      }
      div.innerText = `📌 Última vez: ${reps} (${new Date(w.date).toLocaleDateString()})` + (improvementNote ? `\n${improvementNote}` : '');
      return;
    }
  }
  div.innerText = "";
}


function saveWorkout() {
  const notes = document.getElementById('notesInput').value;
  const date = new Date().toISOString();
  const exercises = [];
  document.querySelectorAll('.exercise-block').forEach(exBlock => {
    const name = exBlock.querySelector('.exerciseName').value;
    const reps = exBlock.querySelectorAll('.reps');
    const weights = exBlock.querySelectorAll('.weight');
    const series = Array.from(reps).map((r, i) => ({
      reps: r.value, weight: weights[i].value
    }));
    exercises.push({ name, series });
  });
  const workout = { date, notes, exercises };
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  history.push(workout);
  localStorage.setItem('history', JSON.stringify(history));
  alert("Entreno guardado");
  showSection('home');
}

function repeatLastWorkout() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  if (!history.length) return alert("No hay entrenos anteriores");
  const last = history[history.length - 1];
  showSection('new');
  document.getElementById('notesInput').value = last.notes || '';
  const container = document.getElementById('exerciseList');
  container.innerHTML = '';
  last.exercises.forEach(ex => {
    addExercise(ex.name);
    const block = container.lastElementChild.querySelector('.seriesList');
    ex.series.forEach(s => {
      const btn = container.lastElementChild.querySelector('button');
      addSerie(btn);
      const lastSerie = block.lastElementChild;
      lastSerie.querySelector('.reps').value = s.reps;
      lastSerie.querySelector('.weight').value = s.weight;
    });
  });
}



function loadHistory() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  const list = document.getElementById('historyList');
  const monthFilter = document.getElementById('monthFilter')?.value;
  const weekFilter = document.getElementById('weekFilter')?.value;
  list.innerHTML = '';

  let filtered = history;

  if (monthFilter) {
    filtered = filtered.filter(w => w.date.startsWith(monthFilter));
  } else if (weekFilter) {
    const start = new Date(weekFilter);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    filtered = filtered.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= start && workoutDate <= end;
    });
  }

  filtered.reverse().forEach(w => {
    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.padding = '1rem';
    div.style.marginBottom = '1rem';
    div.innerHTML = `
      <em>${new Date(w.date).toLocaleDateString()}</em><br>
      <p>${w.notes || ''}</p>
      ${w.exercises.map(ex => `
        <strong>${ex.name}</strong>
        <ul>${ex.series.map(s => `<li>${s.reps} reps x ${s.weight} kg</li>`).join('')}</ul>
      `).join('')}
    `;
    list.appendChild(div);
  });
}

function clearHistory() {
  if (confirm("¿Borrar todo el historial?")) {
    localStorage.removeItem('history');
    loadHistory();
  }
}

function addRoutineExercise() {
  const div = document.createElement('div');
  div.innerHTML = '<input type="text" class="routineExerciseInput" placeholder="Nombre del ejercicio">';
  document.getElementById('routineExercisesList').appendChild(div);
}

function saveRoutine() {
  const name = document.getElementById('routineName').value.trim();
  const inputs = document.querySelectorAll('.routineExerciseInput');
  const exercises = Array.from(inputs).map(i => i.value.trim()).filter(e => e);
  if (!name || !exercises.length) return alert("Completa nombre y al menos un ejercicio.");
  const routines = JSON.parse(localStorage.getItem('routines') || '[]');
  if (editingRoutineIndex !== null) {
    routines[editingRoutineIndex] = { name, exercises };
    editingRoutineIndex = null;
  } else {
    routines.push({ name, exercises });
  }
  localStorage.setItem('routines', JSON.stringify(routines));
  document.getElementById('routineName').value = '';
  document.getElementById('routineExercisesList').innerHTML = '';
  loadSavedRoutines();
  updateRoutineSelector();
}

function loadSavedRoutines() {
  const routines = JSON.parse(localStorage.getItem('routines') || '[]');
  const list = document.getElementById('savedRoutinesList');
  list.innerHTML = '';
  routines.forEach((r, i) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${r.name}</strong>
      <ul>${r.exercises.map(e => `<li>${e}</li>`).join('')}</ul>
      <button onclick="editRoutine(${i})" style="background-color:#3498db;">✏️ Editar</button>
      <button onclick="deleteRoutine(${i})" style="background-color:#e74c3c;">Eliminar</button>
    `;
    list.appendChild(div);
  });
  updateRoutineSelector();
}

function editRoutine(index) {
  const routines = JSON.parse(localStorage.getItem('routines') || '[]');
  const routine = routines[index];
  if (!routine) return;
  document.getElementById('routineName').value = routine.name;
  document.getElementById('routineExercisesList').innerHTML = '';
  routine.exercises.forEach(name => {
    const div = document.createElement('div');
    div.innerHTML = `<input type="text" class="routineExerciseInput" value="${name}" placeholder="Nombre del ejercicio">`;
    document.getElementById('routineExercisesList').appendChild(div);
  });
  editingRoutineIndex = index;
  showSection('routines');
}

function deleteRoutine(index) {
  const routines = JSON.parse(localStorage.getItem('routines') || '[]');
  routines.splice(index, 1);
  localStorage.setItem('routines', JSON.stringify(routines));
  loadSavedRoutines();
}

function updateRoutineSelector() {
  const routines = JSON.parse(localStorage.getItem('routines') || '[]');
  const selector = document.getElementById('routineSelector');
  selector.innerHTML = '<option value="">📅 Seleccionar rutina semanal</option>';
  routines.forEach((r, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = r.name;
    selector.appendChild(opt);
  });
}
updateRoutineSelector();

function exportData() {
  const data = {
    routines: JSON.parse(localStorage.getItem('routines') || '[]'),
    history: JSON.parse(localStorage.getItem('history') || '[]')
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `gymtracker_backup_${date}.json`;
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.routines && data.history) {
        localStorage.setItem('routines', JSON.stringify(data.routines));
        localStorage.setItem('history', JSON.stringify(data.history));
        alert("Datos importados correctamente.");
        updateRoutineSelector();
        loadSavedRoutines();
        loadHistory();
      } else {
        alert("Archivo inválido.");
      }
    } catch (err) {
      alert("Error al leer el archivo.");
    }
  };
  reader.readAsText(file);
}

function showStats() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  if (!history.length) return alert("No hay datos para analizar.");

  let totalEntrenos = history.length;
  let totalPeso = 0;
  let freq = {};

  history.forEach(h => {
    h.exercises.forEach(ex => {
      freq[ex.name] = (freq[ex.name] || 0) + 1;
      ex.series.forEach(s => {
        totalPeso += Number(s.weight || 0);
      });
    });
  });

  let maxEj = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);

  const statsHtml = `
    <div style="border:1px solid #ccc; padding:1rem; margin:1rem 0; background:#fff; border-radius:8px;">
      <strong>📈 Estadísticas:</strong><br>
      Total de entrenamientos: ${totalEntrenos}<br>
      Ejercicio más frecuente: ${maxEj}<br>
      Peso total levantado: ${totalPeso} kg
    </div>
  `;
  document.getElementById('statsContainer').innerHTML = statsHtml;
}

let timer = null;
let seconds = 0;

function toggleTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  } else {
    timer = setInterval(() => {
      seconds++;
      document.getElementById('chrono').textContent = formatTime(seconds);
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  seconds = 0;
  document.getElementById('chrono').textContent = '00:00';
}

function formatTime(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}




function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ").trim();
}

function getExerciseSuggestions() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  const names = new Set();
  history.forEach(w => {
    w.exercises.forEach(e => names.add(normalize(e.name)));
  });
  return Array.from(names);
}

function attachAutocomplete(input) {
  const suggestions = getExerciseSuggestions();
  const datalist = document.getElementById('exerciseSuggestions');
  datalist.innerHTML = '';
  suggestions.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    datalist.appendChild(option);
  });
  input.setAttribute('list', 'exerciseSuggestions');

  input.addEventListener('blur', () => {
    const val = normalize(input.value);
    const match = suggestions.find(s => s.includes(val));
    if (match && match !== val) {
      if (confirm(`¿Querías decir "${match}"?`)) {
        input.value = match;
        input.dispatchEvent(new Event('input'));
      }
    }
  });
}

// ⏎ REEMPLAZA addExercise para añadir autocompletado
const originalAddExercise = addExercise;
addExercise = function(name = '') {
  const id = 'note_' + Math.random().toString(36).substring(2, 9);
  const div = document.createElement('div');
  div.className = 'exercise-block';
  div.innerHTML = `
    <input type="text" placeholder="Nombre del ejercicio" class="exerciseName" value="${name}" oninput="showLastInfo(this, '${id}')">
    <div class="note" id="${id}"></div>
    <div class="seriesList"></div>
    <button onclick="addSerie(this)">➕ Añadir Serie</button>
    <button onclick="this.parentElement.remove()" style="background-color:#e74c3c;margin-top:0.5rem;">❌ Eliminar Ejercicio</button>
  `;
  document.getElementById('exerciseList').appendChild(div);
  const input = div.querySelector('.exerciseName');
  attachAutocomplete(input);
  if (name) showLastInfo(input, id);
};



// Modo oscuro: toggle y persistencia
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
});

// Cargar preferencia guardada
if(localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}

// Mejoras validación y edición en saveWorkout y cargar entreno
let editingWorkoutIndex = null;

function saveWorkout() {
  const notes = document.getElementById('notesInput').value;
  const date = new Date().toISOString();
  const exercises = [];
  let valid = true;
  document.querySelectorAll('.exercise-block').forEach(exBlock => {
    const name = exBlock.querySelector('.exerciseName').value.trim();
    if (!name) {
      alert("Todos los ejercicios deben tener un nombre.");
      valid = false;
      return;
    }
    const reps = exBlock.querySelectorAll('.reps');
    const weights = exBlock.querySelectorAll('.weight');
    const series = [];
    for(let i = 0; i < reps.length; i++) {
      const rep = parseInt(reps[i].value);
      const weight = parseFloat(weights[i].value);
      if (isNaN(rep) || rep <= 0 || isNaN(weight) || weight < 0) {
        alert("Las repeticiones y pesos deben ser números positivos.");
        valid = false;
        return;
      }
      series.push({ reps: rep, weight: weight });
    }
    exercises.push({ name, series });
  });
  if (!valid) return;

  const workout = { date, notes, exercises };
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  if(editingWorkoutIndex !== null){
    history[editingWorkoutIndex] = workout;
    editingWorkoutIndex = null;
  } else {
    history.push(workout);
  }
  localStorage.setItem('history', JSON.stringify(history));
  alert("Entreno guardado");
  clearNewWorkoutForm();
  showSection('home');
  loadHistory();
}

function clearNewWorkoutForm(){
  document.getElementById('notesInput').value = '';
  document.getElementById('exerciseList').innerHTML = '';
  // reset timer if you want
  resetTimer();
}

// Cargar entreno para editar desde historial
function editWorkout(index){
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  const workout = history[index];
  if(!workout) return;
  editingWorkoutIndex = index;
  showSection('new');
  document.getElementById('notesInput').value = workout.notes || '';
  document.getElementById('exerciseList').innerHTML = '';
  workout.exercises.forEach(ex => {
    addExercise(ex.name);
    const block = document.getElementById('exerciseList').lastElementChild.querySelector('.seriesList');
    ex.series.forEach(s => {
      const btn = document.getElementById('exerciseList').lastElementChild.querySelector('button');
      addSerie(btn);
      const lastSerie = block.lastElementChild;
      lastSerie.querySelector('.reps').value = s.reps;
      lastSerie.querySelector('.weight').value = s.weight;
    });
  });
}

// Modificar loadHistory para añadir botón Editar
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  const monthFilter = document.getElementById('monthFilter')?.value;
  const weekFilter = document.getElementById('weekFilter')?.value;
  const list = document.getElementById('historyList');
  list.innerHTML = '';

  let filtered = history;

  if (monthFilter) {
    filtered = filtered.filter(w => w.date.startsWith(monthFilter));
  } else if (weekFilter) {
    const start = new Date(weekFilter);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    filtered = filtered.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= start && workoutDate <= end;
    });
  }

  filtered.reverse().forEach((w, i) => {
    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.padding = '1rem';
    div.style.marginBottom = '1rem';
    div.innerHTML = `
      <em>${new Date(w.date).toLocaleDateString()}</em><br>
      <p>${w.notes || ''}</p>
      ${w.exercises.map(ex => `
        <strong>${ex.name}</strong>
        <ul>${ex.series.map(s => `<li>${s.reps} reps x ${s.weight} kg</li>`).join('')}</ul>
      `).join('')}
      <button onclick="editWorkout(${history.length - 1 - i})" style="background-color:#3498db; color:white; border:none; padding:0.4rem 0.8rem; border-radius:8px; cursor:pointer;">✏️ Editar</button>
    `;
    list.appendChild(div);
  });
}
