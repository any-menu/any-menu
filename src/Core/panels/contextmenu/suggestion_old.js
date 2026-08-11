import { global_setting } from "../../shared/setting";
export function input_suggestion(el_input, el_container) {
    el_container.classList.add('autocomplete-p');
    const suggestions = ['list2table', 'list2tab', 'list2markmap', 'list2mermaid'];
    let currentFocus = -1;
    el_input.addEventListener('input', function () {
        const val = this.value;
        closeAllLists();
        currentFocus = -1;
        const suggestionList = document.createElement("div");
        suggestionList.setAttribute("id", "autocomplete-list");
        suggestionList.setAttribute("class", "autocomplete-items");
        el_container.appendChild(suggestionList);
        for (const item of suggestions) {
            if (val && item.substring(0, val.length).toUpperCase() != val.toUpperCase())
                continue;
            const suggestionItem = document.createElement("div");
            global_setting.api.safeInnerHTML(suggestionItem, "<strong>" + item.substring(0, val.length) + "</strong>" + item.substring(val.length));
            suggestionItem.dataset.value = item;
            suggestionItem.addEventListener("click", function (ev) {
                ev.preventDefault();
                el_input.value = this.dataset.value;
                const ctrlEnterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    ctrlKey: true,
                    bubbles: true,
                    cancelable: true
                });
                el_input.dispatchEvent(ctrlEnterEvent);
                closeAllLists();
            });
            suggestionList.appendChild(suggestionItem);
        }
    });
    el_input.addEventListener('keydown', (ev) => {
        let el_list = document.getElementById("autocomplete-list");
        let el_items;
        if (el_list)
            el_items = el_list.getElementsByTagName("div");
        if (!el_items)
            return;
        if (ev.key == 'ArrowDown') {
            currentFocus++;
            addActive(el_items);
        }
        else if (ev.key == 'ArrowUp') {
            currentFocus--;
            addActive(el_items);
        }
        else if (ev.key == 'Enter') {
            if (currentFocus > -1) {
                ev.preventDefault();
                if (el_items)
                    el_items[currentFocus].click();
            }
        }
        else if (ev.key == 'Tab') {
            if (currentFocus > -1) {
                ev.preventDefault();
                if (el_items)
                    el_input.value = el_items[currentFocus].dataset.value;
            }
        }
    });
    function addActive(list) {
        if (!list)
            return false;
        removeActive(list);
        if (currentFocus >= list.length)
            currentFocus = 0;
        if (currentFocus < 0)
            currentFocus = (list.length - 1);
        list[currentFocus].classList.add("focus-active");
        list[currentFocus].scrollIntoView({ block: 'nearest' });
    }
    function removeActive(list) {
        for (let i = 0; i < list.length; i++) {
            list[i].classList.remove("focus-active");
        }
    }
    function closeAllLists() {
        var _a;
        const lists = document.getElementsByClassName("autocomplete-items");
        for (let i = lists.length - 1; i >= 0; i--) {
            (_a = lists[i].parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(lists[i]);
        }
    }
}
