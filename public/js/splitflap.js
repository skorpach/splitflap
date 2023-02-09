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
	
	this.bottom.addEventListener('transitionend', this._onAnimEnd.bind(this));
	this.top.addEventListener('transitionend', this._onAnimEnd.bind(this));
	this.bottom.addEventListener('transitionrun', this._onAnimRun.bind(this));
	this.top.addEventListener('transitionrun', this._onAnimRun.bind(this)); 
    }

    _onAnimRun(){
	this._running++;
    }

    _onAnimEnd(){
	if(--this._running == 0 && !!this.onAnimationEnd)
	    this.onAnimationEnd();
    }
    
    remove(){
	this.top.remove();
	this.bottom.remove();
    }
    
    set state(ns) {
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
	    this.activeFlap = new Flap(this.container, this.drum[this.pos]);
	    this.activeFlap.state = 1;
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

		let awaiting = 2;
		let _onEnd = () => {
		    if(--awaiting > 0)
			return;
		    
		    this.activeFlap.remove();
		    this.activeFlap = this.nextFlap;
		    this.activeFlap.current = true;
		    this.nextFlap = null;
		    this.pos = nPos;
		    this.animating = false;
		    resolve();
		};
		
		this.activeFlap.onAnimationEnd = _onEnd;
		this.nextFlap.onAnimationEnd = _onEnd;

		// Delay until after the new flap has rendered in state 0
		setTimeout(() => {
		    this.activeFlap.state = 2;
		    this.nextFlap.state = 1;
		}, 10);
	    });
	}

	seek(val){
	    val = val.toString();
	    
	    return new Promise((resolve, reject) => {
		if(this.values.find(x => x == val) == -1)
		    reject('Out of range');
		
		if(this.animating)
		    resolve();

		let i = () => {
		    if(this.value != val)
			this.advance().then(i);
		    else
			resolve();
		};
		i();
	    });
	}
    });
