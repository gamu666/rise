// Guided registration entry reuses the existing form and never creates a record on card click.
(()=>{
 const home=document.querySelector('.ai-home');
 if(!home||home.querySelector('.home-registration-card'))return;
 home.classList.add('has-registration-card');
 const card=document.createElement('button');card.type='button';card.className='home-registration-card';
 card.innerHTML='<span class="home-registration-top"><span class="home-registration-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 15h8M12 11v8"/></svg></span><svg class="home-registration-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></span><strong>Шинэ бүртгэл үүсгэх</strong><span class="home-registration-description">AI-тай хамт бүртгэлээ эхлүүлэх</span>';
 const row=document.createElement('div');row.className='home-quick-actions';row.append(card);home.append(row);
 const composer=home.querySelector('.ai-composer'),prompt=composer.querySelector('textarea'),welcome=home.querySelector('.ai-welcome');let preparing=false;
 card.addEventListener('click',()=>{preparing=true;card.setAttribute('aria-pressed','true');home.classList.add('registration-started');welcome.querySelector('h1').textContent='Шинэ бүртгэлээ эхлүүлье';welcome.querySelector('p').textContent='Эхлээд суралцагчийн овог, нэрийг бичээрэй.';prompt.placeholder='Суралцагчийн овог, нэр…';prompt.maxLength=60;home.querySelector('.ai-status').textContent='';prompt.focus();});
 composer.addEventListener('submit',event=>{if(!preparing)return;event.preventDefault();event.stopImmediatePropagation();const name=prompt.value.trim();if(!name)return;workspaceSelect('register');const form=document.querySelector('#registration-form');form.elements.name.value=name;form.elements.phone.focus();preparing=false;card.setAttribute('aria-pressed','false');home.classList.remove('registration-started');welcome.querySelector('h1').textContent='Тавтай морил, Тэмүүлэн!';welcome.querySelector('p').textContent='Өнөөдрийн ажилд тань юугаар туслах вэ?';prompt.value='';prompt.removeAttribute('maxlength');prompt.placeholder='Асуултаа асуугаарай, эсвэл хийх ажлаа бичээрэй…';prompt.dispatchEvent(new Event('input',{bubbles:true}));},true);
})();
