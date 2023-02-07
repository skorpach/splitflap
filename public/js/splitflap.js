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

</div>
`

window.customElements.define(
    'split-flap',
    class extends HTMLElement {
	constructor(){
	    super();

	    console.log('here');
	    const shadow = this.attachShadow({mode: 'open'});
	    
	    shadow.innerHTML = flipTemplate;
	    this.container = shadow.querySelector('div');
	    
	    this.drum = [...Array(10).keys()].map(x => {
		let el = document.createElement('div');
		el.innerText = x;
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

	advance(){
	    if(this.animating)
		return;
	    this.animating = true;

	    return new Promise((resolve, reject) => {
		let nPos = this.pos + 1;
		if(nPos >= this.drum.length)
		    nPos = 0;
		
		this.nextFlap = new Flap(this.container, this.drum[nPos]);

		let nComplete = 0;
		let onAnimComplete = () => {
		    if(++nComplete < 2)
			return;
		    this.pos = nPos;
		    this.activeFlap = this.nextFlap;
		    // TODO: Emit an event that we've advanced one...
		    this.animating = false;
		}

		// Delay until after the new flap has rendered in state 0
		setTimeout(() => {
		    this.activeFlap.state = 2;
		    this.nextFlap.state = 1;

		    setTimeout(() => {
			this.activeFlap.remove();
			this.activeFlap = this.nextFlap;
			this.activeFlap.current = true;
			this.nextFlap = null;
			this.pos = nPos;
			this.animating = false;
			resolve();
		    }, 160);
		}, 50);
	    });
	}

	seek(pos){
	    if(pos >= this.drum.length)
		throw 'Out of range';

	    let i = () => {
		if(this.pos != pos)
		    this.advance().then(i);
	    };
	    i();
	}
    });
