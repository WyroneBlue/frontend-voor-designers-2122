const checkVibration = () => {
	if (!window || !window.navigator || !window.navigator.vibrate) {
		return false;
	}
	return true;
};

const vibrate = ({ms = [10]}) => {
	if(checkVibration){
		navigator.vibrate(ms);
	}
};

window.addEventListener('DOMContentLoaded', checkVibration);

export {
    vibrate
}