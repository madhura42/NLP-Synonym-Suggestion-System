from flask import Flask,url_for,render_template,request,jsonify
import gensim
from gensim.models import Word2Vec,KeyedVectors
from gensim.models import word2vec
import json
import language_check
from nltk.tokenize import sent_tokenize, word_tokenize

app = Flask(__name__)

@app.route("/")
def hellow():
	return "hello"

@app.route("/index")
def index():
	return (render_template("home.html"))

@app.route("/editor")
def editor():
	return (render_template("editor.html"))

@app.route("/letter")
def letter():
	return (render_template("letter.html"))

@app.route("/essay")
def essay():
	return (render_template("essay.html"))

@app.route("/blog")
def blog():
	return (render_template("blog.html"))


@app.route('/receiver', methods = ['POST'])
def worker():
	# read json + reply
	data = request.get_json()
	result = ''

	for item in data:
		# loop over every row
		result += str(item['make']) + '\n'

	return result
@app.route("/grammarCheck", methods = ['POST'])
def grammarCheck():
	data = request.get_json(force=True)
	print(data)
	matches = tool.check(data)
	return json.dumps(matches, default=lambda o: o.__dict__)
	


@app.route("/check", methods = ['POST'])
def check():
	data = request.get_json(force=True)
	print(data['word'])
	a = []#synonyms from model
	if(data['word'] in model.vocab):
		syns = model.most_similar(data['word'], topn = 5)
		#print(syns)
		#f=[]#final words after comparing
		for syn in syns:
			a.append(syn[0])
		print(a)

	else:
		a.append("notavailable")
	return json.dumps(a)

@app.route("/retrain", methods = ['POST'])
def retrain():
	data = request.get_json(force=True)
	sentences = word_tokenize(data)
	model_2 = Word2Vec(size=100, min_count=1)
	model_2.build_vocab(sentences)
	total_examples = model_2.corpus_count
	model = KeyedVectors.load_word2vec_format("glove_model_100.bin", binary=True)
	model_2.build_vocab([list(model.vocab.keys())], update=True)
	model_2.intersect_word2vec_format("glove_model_100.bin", binary=True, lockf=1.0)
	model_2.train(sentences, total_examples=total_examples, epochs=model_2.iter)
	"""model2 = gensim.models.Word2Vec(sentences)
	model2.intersect_word2vec_format('glove_model_100.bin',lockf=1.0,binary=True)
	model2.train(sentences)"""

with app.test_request_context():
	print(url_for("index"))

if __name__ == "__main__":
	model = KeyedVectors.load_word2vec_format("glove_model_100.bin", binary=True)
	#model = gensim.models.Word2Vec.load("glove_model_100.bin")
	print(len(model.wv.vocab))
	#porter = PorterStemmer()
	tool = language_check.LanguageTool('en-US')
	app.run(port=5000)
