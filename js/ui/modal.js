// The shared modal dialog.
import { $ } from '../util.js';

export function openModal(html, wide) {
  $('#modalBox').innerHTML = html;
  $('#modalBox').classList.toggle('wide', !!wide);
  $('#modal').hidden = false;
}

export function closeModal() {
  $('#modal').hidden = true;
  $('#modalBox').innerHTML = '';
}

export function confirmBox(title, text, yesLabel, yes) {
  openModal(`<h2 style="font-size:2em">${title}</h2><p style="font-size:1.15em">${text}</p>
   <div class="modal-actions"><button class="btn white" id="cfNo">No, stay</button><button class="btn pink" id="cfYes">${yesLabel}</button></div>`);
  $('#cfNo').onclick = closeModal;
  $('#cfYes').onclick = () => {
    closeModal();
    yes();
  };
}
