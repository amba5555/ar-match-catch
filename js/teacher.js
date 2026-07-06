import { SUBJECTS, loadBank } from './questions.js';
import { downloadJson } from './utils.js';
const $=s=>document.querySelector(s);const FILES=SUBJECTS.filter(s=>s.file).map(s=>s.file);let current=null,currentFile=FILES[0]||'math-quick.json';
function fillBanks(){$('#teacherBankSelect').innerHTML=SUBJECTS.filter(s=>s.file).map(s=>`<option value="${s.file}">${s.name}</option>`).join('')}
function render(bank){current=bank;$('#subjectInput').value=bank.subject||'';$('#gradeInput').value=bank.grade||'';$('#categoryInput').value=bank.category||'';$('#questionsEditor').value=JSON.stringify(bank.questions||[],null,2);status(`โหลดแล้ว ${bank.questions?.length||0} ข้อ`,true)}
function collect(){return{subject:$('#subjectInput').value,grade:$('#gradeInput').value,category:$('#categoryInput').value,questions:JSON.parse($('#questionsEditor').value)}}
function status(t,ok=true){$('#teacherStatus').textContent=t;$('#teacherStatus').className='status-line '+(ok?'ok':'bad')}
async function loadSelected(){try{currentFile=$('#teacherBankSelect').value;render(await loadBank(currentFile))}catch(e){status(e.message,false)}}
$('#loadBankBtn').addEventListener('click',loadSelected);$('#validateBtn').addEventListener('click',()=>{try{const b=collect();status(`JSON ถูกต้อง มี ${b.questions.length} ข้อ`,true)}catch(e){status('JSON ไม่ถูกต้อง: '+e.message,false)}});
$('#addQuestionBtn').addEventListener('click',()=>{try{const q=JSON.parse($('#questionsEditor').value||'[]');q.push({id:`custom_${Date.now()}`,text:'1 + 1 = ?',answer:'2',options:['2','1','3','4'],hint:'นับ 1 แล้วเพิ่มอีก 1',grade:'4'});$('#questionsEditor').value=JSON.stringify(q,null,2);status('เพิ่มคำถามตัวอย่างแล้ว',true)}catch(e){status(e.message,false)}});
$('#saveLocalBtn').addEventListener('click',()=>{try{const b=collect();localStorage.setItem(`bank:${currentFile}`,JSON.stringify(b));status('บันทึกในเครื่องแล้ว',true)}catch(e){status(e.message,false)}});
$('#exportBankBtn').addEventListener('click',()=>{try{downloadJson(currentFile,collect())}catch(e){status(e.message,false)}});
$('#importJson').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{render(JSON.parse(await file.text()));status('นำเข้าไฟล์แล้ว ตรวจและบันทึกได้',true)}catch(err){status(err.message,false)}});
$('#makePromptBtn').addEventListener('click',()=>{$('#aiPrompt').value='Generate 10 questions for Thai grade 7 students. Each must have id, text, answer, options (1 correct + 3 wrong), hint, grade. Output valid JSON array.'});
fillBanks();loadSelected();