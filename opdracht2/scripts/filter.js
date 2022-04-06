const filters = {
    items: {
        order: {
            name: 'order',
            items: 'A-Z',
            get count(){
                return 1
            }
        },
        genre: {
            name: 'genre',
            items: [],
            get count(){
                return this.items.length
            }
        }
    },
    get count(){
        return this.items.order.count + this.items.genre.count
    }
}

const checkFiltersCount = () => {
    return filters.count;
}

const updateFilter = (type, value) => {
    filters.items[type].items = value;
}

const checkFilter = (type, value) => {
    return filters.items[type];
}

const resetFilters = (form) => {
	form.reset();
}

export {
	filters,
    updateFilter,
    checkFilter,
    checkFiltersCount,
	resetFilters
}