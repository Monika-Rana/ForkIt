import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import {elements , renderLoader,clearLoader} from './views/base';
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likestView from './views/likesView'
/*
- Search Object 
-current recipe Object
-shopping list object
- Liked recipes
*/ 

const state = {};

window.state = state;
//Search Controller
const controlSearch = async () => {
    //1. get query from view
    const query = searchView.getInput();
    
    if(query){
        //2. New Search object and add to state
        state.search = new Search(query);

        //3. update the ui for the results like clear the input, add spinner
        searchView.clearInput();
        searchView.clearResult();
        renderLoader(elements.searchRes);
        //4. search for recipes
        await state.search.getResults();
        //5. Render results to the ui
        clearLoader();
        searchView.renderResults(state.search.result);
    }
}

elements.searchForm.addEventListener('submit' , e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click' , e => {
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto,10);
        searchView.clearResult();
        searchView.renderResults(state.search.result, goToPage);
    }
});
//REcipe Controller
const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
       if (state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                //state.likes.isLiked(id)
            );

        } catch (err) {
            console.log(err);
            alert('Error processing recipe!');
        }
    }
};
 
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
/*List Controller */
const constrolList = () =>{

    //create a new List if not yet
    if(!state.list) state.list = new List();

    //Add Each ingred to hte list and ui
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    
    });

}

//Handle delete and update list item value
elements.shopping.addEventListener( 'click' ,e => {

const id = e.target.closest('.shopping-item ').dataset.itemid;

//handlin delete

    if(e.target.matches('.shopping__delete .shopping__delete *')){

        state.list.deleteItem(id);

         listView.deleteItem(id);

//handel the count 
    }else if(e.target.matches('.shopping__count-value')){
    const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);

    }

});

//Like Controller
const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;


    if(!state.likes.isLiked(currentId)){
        const newLike = state.likes.addLike(currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img);

         likestView.toggleLikeBtn(true); 

         likestView.renderLikes(newLike);


    } else {
        state.likes.deleteLike(currentId);
        likestView.toggleLikeBtn(false); 
        likesView.deleteLike(currentId);  

    }

    likesView.toggleLikeMenu(state.likes.getNumLikes())
}

//Restore likes recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    state.likes.readStorage();

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLikes(like));
});
 
//Event deligation, recipe click button
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //decrease button is clicked
        if(state.recipe.serving > 1 )
        {   
            state.recipe.updateServing('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else  if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServing('inc');
        recipeView.updateServingsIngredients(state.recipe);

    } else if(e.target.matches('recipe__btn--add, .recipe__btn--add *')){
        //add ingred to shopping list
        constrolList();
    } else if(e.target.matches('.recipe__love , .recipe__love *')){
        //like controller
        controlLike();
    }

});



