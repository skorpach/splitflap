class Flap {
    constructor(container, content){
	this.top = document.createElement('div');
	this.bottom = document.createElement('div');
	this._state = 0;

	this.top.classList.add('flap', 'flap-top')
	this.bottom.classList.add('flap', 'flap-bottom');

	this.top.appendChild(content.cloneNode(true));
	this.bottom.appendChild(content.cloneNode(true));

	container.appendChild(this.top);
	container.appendChild(this.bottom);

	this.current = false;
	this._running = 0;

	this.eventTarget = new EventTarget();
	
	this.bottom.addEventListener('transitionend', this._onAnimEnd.bind(this));
	this.top.addEventListener('transitionend', this._onAnimEnd.bind(this));
	this.bottom.addEventListener('transitionrun', this._onAnimRun.bind(this));
	this.top.addEventListener('transitionrun', this._onAnimRun.bind(this)); 
    }

    _onAnimRun(){
	this._running++;
    }

    _onAnimEnd(){
	if(--this._running == 0)
	    this.eventTarget.dispatchEvent(new Event('animationend'));
    }
    
    remove(){
	this.top.remove();
	this.bottom.remove();
	this.top = null;
	this.bottom = null;
    }
    
    setState(ns) {
	const down = 'is-down';
	
	if(ns < 2)
	    this.top.classList.remove(down);
	else
	    this.top.classList.add(down);

	if(ns > 0)
	    this.bottom.classList.add(down);
	else
	    this.bottom.classList.remove(down);

	this._state = ns;

	return Promise.any([
	    new Promise(resolve => {
		let l = () => {
		    resolve();
		    this.eventTarget.removeEventListener('animationend', l);
		};
		this.eventTarget.addEventListener('animationend', l)
	    }),
	    new Promise(resolve => {
		setTimeout(resolve, 2000);
	    })]);
    }

    set current(c){
	if(c){
	    this.top.style['z-index'] = 11;
	    this.bottom.style['z-index'] = 10;
	}else{
	    this.top.style['z-index'] = 10;
	    this.bottom.style['z-index'] = 11;
	}
    }
}

const flipTemplate = `
<link rel="stylesheet" href="/css/splitflap.css" />
<div class="flip">
</div>`;

const numbersDrum = [...Array(10).keys()];
const alphaDrum = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

window.customElements.define(
    'split-flap',
    class extends HTMLElement {
	constructor(){
	    super();

	    console.log('here');
	    const shadow = this.attachShadow({mode: 'open'});
	    
	    shadow.innerHTML = flipTemplate;
	    this.container = shadow.querySelector('div');

	    this.values = alphaDrum;
	    this.drum = this.values.map(x => {
		let el = document.createElement('div');
		el.innerText = x.toString();
		return el;
	    });

	    this.pos = 0;
	    this.targetPos = null;
	    this.seeker = null;
	    this.activeFlap = new Flap(this.container, this.drum[this.pos]);
	    this.activeFlap.setState(1);
	    this.activeFlap.current = true;
	    this.nextFlap = null;
	    this.animating = false;
 	    
	    shadow.addEventListener('click', this.advance.bind(this));
	}

	get value() {
	    return this.values[this.pos];
	}
	
	advance(){
	    return new Promise((resolve, reject) => {
		if(this.animating)
		    reject();
		this.animating = true;

		let nPos = this.pos + 1;
		if(nPos >= this.drum.length)
		    nPos = 0;
		
		this.nextFlap = new Flap(this.container, this.drum[nPos]);

		setTimeout(() => {
		    Promise.all([
			this.activeFlap.setState(2),
			this.nextFlap.setState(1)
		    ]).then(() => {
			this.activeFlap.remove();
			this.activeFlap = this.nextFlap;
			this.activeFlap.current = true;
			this.nextFlap = null;
			this.pos = nPos;
			this.animating = false;

			if(this.seeking)
			    this.seeking();
			resolve();
		    });
		}, 10);
	    });
	}

	seek(val){
	    val = val.toString();
	    let target = this.values.indexOf(val);

	    if(target == -1)
		throw 'Out of Range';

	    this.targetPos = target;

	    if(this.seeking)
		return;

	    this.seeking = () => {
		if(this.pos != this.targetPos)
		    this.advance();
		else
		    this.seeking = null;	
	    };

	    if(!this.animating)
		this.seeking();
	}
    });
