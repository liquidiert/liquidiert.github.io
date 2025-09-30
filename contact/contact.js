
  import { loadPage } from '/@nue/view-transitions.js'

export const lib = [
{
  name: 'contact-me',
  tagName: 'form',
  tmpl: '<form autocomplete="on" @submit="0"> <label> <span>Your name</span> <input type="text" name="name" placeholder="Example: John Doe" required> </label> <label> <span>Your email</span> <input type="email" name="email" placeholder="your@email.com" required> </label> <button>Lets talk!</button> </form>',
  Impl: class { 
    submit() {
      loadPage('thanks.html')
    }
   },
  fns: [
    (_,e) => { {e.preventDefault();_.submit.call(_, e)} }
  ]
}]
export default lib[0]