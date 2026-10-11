const API = '/api/opportunities';

const fields = ['title', 'description', 'researchArea', 'facultyName', 'department', 'requiredSkills', 'positions', 'deadline', 'status'];
const required = ['title', 'description', 'researchArea', 'facultyName', 'department', 'requiredSkills', 'positions', 'deadline'];

// Escape text before putting it in HTML
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showMessage(text, type) {
  const box = document.getElementById('message');
  box.innerHTML = '<div class="alert alert-' + type + '">' + esc(text) + '</div>';
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}

// Calls the API and returns {ok, status, data}
async function request(url, method, body) {
  try {
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data: data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: 'Cannot reach the server' } };
  }
}

// ---------- List ----------
async function loadList() {
  const result = await request(API, 'GET');
  if (!result.ok) return showMessage(result.data.error, 'danger');

  const body = document.getElementById('listBody');
  if (result.data.length === 0) {
    body.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No opportunities yet</td></tr>';
    return;
  }

  body.innerHTML = result.data.map(o => {
    const badge = o.status === 'Open' ? 'success' : 'secondary';
    const closeBtn = o.status === 'Open'
      ? '<button class="btn btn-sm btn-warning" onclick="closeOpp(' + o.id + ')">Close</button> '
      : '';
    return '<tr>' +
      '<td>' + o.id + '</td>' +
      '<td>' + esc(o.title) + '</td>' +
      '<td>' + esc(o.researchArea) + '</td>' +
      '<td>' + esc(o.facultyName) + '</td>' +
      '<td>' + o.positions + '</td>' +
      '<td>' + esc(o.deadline) + '</td>' +
      '<td><span class="badge bg-' + badge + '">' + o.status + '</span></td>' +
      '<td>' +
        '<button class="btn btn-sm btn-info" onclick="viewOpp(' + o.id + ')">View</button> ' +
        '<button class="btn btn-sm btn-primary" onclick="editOpp(' + o.id + ')">Edit</button> ' +
        closeBtn +
        '<button class="btn btn-sm btn-danger" onclick="deleteOpp(' + o.id + ')">Delete</button>' +
      '</td></tr>';
  }).join('');
}

// ---------- Details ----------
async function viewOpp(id) {
  const result = await request(API + '/' + id, 'GET');
  if (!result.ok) {
    showMessage(result.data.error + ' (' + result.status + ')', 'danger');
    return loadList();
  }
  const o = result.data;
  document.getElementById('detailsBody').innerHTML =
    '<h5>' + esc(o.title) + ' <span class="badge bg-' + (o.status === 'Open' ? 'success' : 'secondary') + '">' + o.status + '</span></h5>' +
    '<p>' + esc(o.description) + '</p>' +
    '<p><b>Research Area:</b> ' + esc(o.researchArea) + '<br>' +
    '<b>Faculty:</b> ' + esc(o.facultyName) + '<br>' +
    '<b>Department:</b> ' + esc(o.department) + '<br>' +
    '<b>Required Skills:</b> ' + esc(o.requiredSkills) + '<br>' +
    '<b>Positions:</b> ' + o.positions + '<br>' +
    '<b>Deadline:</b> ' + esc(o.deadline) + '</p>' +
    '<button class="btn btn-secondary btn-sm" onclick="hideDetails()">Close Details</button>';
  document.getElementById('detailsBox').classList.remove('d-none');
  window.scrollTo(0, 0);
}

function hideDetails() {
  document.getElementById('detailsBox').classList.add('d-none');
}

// ---------- Form ----------
function showForm() {
  document.getElementById('oppForm').reset();
  document.getElementById('oppId').value = '';
  document.getElementById('formTitle').textContent = 'New Research Opportunity';
  clearErrors();
  document.getElementById('formBox').classList.remove('d-none');
  window.scrollTo(0, 0);
}

function hideForm() {
  document.getElementById('formBox').classList.add('d-none');
}

async function editOpp(id) {
  const result = await request(API + '/' + id, 'GET');
  if (!result.ok) {
    showMessage(result.data.error + ' (' + result.status + ')', 'danger');
    return loadList();
  }
  showForm();
  document.getElementById('formTitle').textContent = 'Update Research Opportunity #' + id;
  document.getElementById('oppId').value = id;
  fields.forEach(f => { document.getElementById(f).value = result.data[f]; });
}

function clearErrors() {
  fields.forEach(f => document.getElementById(f).classList.remove('is-invalid'));
}

// Basic validation of required fields; returns true if valid
function validateForm() {
  clearErrors();
  let valid = true;
  required.forEach(f => {
    const input = document.getElementById(f);
    if (input.value.trim() === '') {
      input.classList.add('is-invalid');
      valid = false;
    }
  });
  const pos = Number(document.getElementById('positions').value);
  if (document.getElementById('positions').value !== '' && (!Number.isInteger(pos) || pos < 1)) {
    document.getElementById('positions').classList.add('is-invalid');
    valid = false;
  }
  return valid;
}

document.getElementById('oppForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!validateForm()) return showMessage('Please fill in all required fields correctly', 'danger');

  const data = {};
  fields.forEach(f => { data[f] = document.getElementById(f).value.trim(); });
  data.positions = Number(data.positions);

  const id = document.getElementById('oppId').value;
  const result = id
    ? await request(API + '/' + id, 'PUT', data)
    : await request(API, 'POST', data);

  if (!result.ok) return showMessage(result.data.error + ' (' + result.status + ')', 'danger');

  showMessage(id ? 'Opportunity updated successfully' : 'Opportunity created successfully', 'success');
  hideForm();
  loadList();
});

// ---------- Close / Delete ----------
async function closeOpp(id) {
  const result = await request(API + '/' + id, 'PUT', { status: 'Closed' });
  if (!result.ok) return showMessage(result.data.error + ' (' + result.status + ')', 'danger');
  showMessage('Opportunity closed', 'success');
  loadList();
}

async function deleteOpp(id) {
  if (!confirm('Delete this opportunity?')) return;
  const result = await request(API + '/' + id, 'DELETE');
  if (!result.ok) return showMessage(result.data.error + ' (' + result.status + ')', 'danger');
  showMessage('Opportunity deleted', 'success');
  hideDetails();
  loadList();
}

loadList();
