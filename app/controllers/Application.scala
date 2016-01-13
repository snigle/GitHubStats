package controllers

import play.api._
import play.api.libs.json.Json
import play.api.libs.json.Reads
import play.api.libs.ws.WSClient
import play.api.libs.ws.WSResponse
import play.api.mvc._
import com.typesafe.config.ConfigFactory
import javax.inject.Inject
import play.api.libs.json._
import play.api.libs.functional.syntax._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import scala.concurrent.Await
import scala.concurrent.duration._
import scala.concurrent.Future
import models._

class Application @Inject() (ws: WSClient) extends Controller {

  //Index : load angularjs
  def index(name: String = "") = Action(parse.empty) { implicit request =>
    render {
      case Accepts.Html() => Ok(views.html.index(name + " - GitHubStats")(request))
    }

  }

  def head(request: Request[Any]) = request.cookies.get("access_token") match {
    case None => ("Accept" -> "application/json")
    case Some(access_token) => ("Authorization" -> ("token " + access_token.value))
  }
  //Handle authentification token for a request
  def authenticatedRequest(request: Request[Any], url: String, successCallback: (WSResponse) => Result): Future[Result] = {
    ws.url(url).withHeaders(head(request)).get.map(response => {
      if (response.status == 200) {
        successCallback(response)
          .withHeaders(
            "x-ratelimit-remaining" -> response.header("X-RateLimit-Remaining").getOrElse("0"),
            "x-ratelimit-reset" -> response.header("X-RateLimit-Reset").getOrElse("0")
          )
      } else if (response.status == 401) { //wrong token
        Unauthorized.withCookies(Cookie("access_token", "", Some(0)))
      } else {
        Status(response.status)
      }
    })
  }

  //Get repository details
  def repo(repo: String) = Action.async(parse.empty) { implicit request =>
    authenticatedRequest(request, "https://api.github.com/repos/" + repo, response => {
      render {
        case Accepts.Json() => Ok(Json.toJson(response.json.validate[Repo].get))
      }

    })

  }

  //Get list of commits and total by author
  def commits(repo: String, page: Int) = Action.async(parse.empty) { implicit request =>

    //Get all contributors for the first call
    val future_users = page match {
      case 1 => ws.url("https://api.github.com/repos/" + repo + "/contributors?per_page=1000")
        .withHeaders(head(request)).get.map(response => {
          response.json.validate[Seq[Author]](Reads.seq[Author](Author.authorReader)).getOrElse(Nil)
        })
      case _ => Future(Nil)
    }

    //Get 100 last commits
    authenticatedRequest(request, "https://api.github.com/repos/" + repo + "/commits?per_page=100&page=" + page, response => {
      val commits = response.json.validate[Seq[Commit]].get;
      val commiters = page match {
        case 1 => commits.groupBy(commit => commit.author.email).mapValues(c_all =>
          Author(
            c_all.flatMap(a => a.author.login).headOption,
            c_all.map(a => a.author.name).head,
            c_all.map(a => a.author.email).head,
            c_all.flatMap(a => a.author.avatar_url).headOption,
            c_all.flatMap(a => a.author.url).headOption,
            Some(c_all.length)
          )).values
        case _ => Nil
      }

      //Add contributors which are not in last 100 commits
      val users = Await.result(future_users, 20 seconds).filter(a => commiters.find(c => c.login == a.login) == None)
      val authors = commiters ++ users
      //Create map (Year,(Month ,commits))
      val commitsByDate1 = commits.groupBy(c => c.date.year.get.toString).mapValues(v => v.groupBy(c => c.date.monthOfYear))
      //Sort by year and by month and change the key by the month name
      val commitsByDate = Map(commitsByDate1.toSeq.sortBy(_._1).reverse: _*).mapValues(v => Map(v.toSeq.sortBy(_._1.get).reverse: _*))
        .mapValues(v => v.map(m => m match { case (key, value) => (key.getAsText(java.util.Locale.ENGLISH), value) }))
      
        
        render {
          case Accepts.Json() => Ok(Json.toJson(Map(
          "commits" -> Json.toJson(commitsByDate),
          "totalCommits" -> Json.toJson(commits.length),
          "authors" -> Json.toJson(authors)
          )))
        }
      
    });
  }

  //Ask access_token from gitHub and save it in cookie
  def login(code: String) = Action.async { implicit request =>
    {
      println(ConfigFactory.load().getString("github.client_id"))
      println(ConfigFactory.load().getString("github.client_secret"))
      ws.url("https://github.com/login/oauth/access_token").withHeaders("Accept" -> "application/json").post(
        Json.toJson(Map(
          "client_id" -> ConfigFactory.load().getString("github.client_id"), //"023b4b4bb7288038ddc4",
          "client_secret" -> ConfigFactory.load().getString("github.client_secret"), //"43f14fe116ac645011d70711d59fdcc0e09a4bbf",
          "code" -> code
        ))
      )
        .map(response => {
          val cookie = (response.json \ "access_token") match {
            case JsDefined(access_token) => Cookie(
              "access_token",
              access_token.toString,
              Some(60 * 60 * 24 * 7),
              httpOnly = true
            )
            case _ => Cookie("access_token", "", Some(0))

          }
          
          render {
          case Accepts.Json() => 
                Ok(response.json).withCookies(
                  cookie
                )
          }
        })

    }
  }

}
